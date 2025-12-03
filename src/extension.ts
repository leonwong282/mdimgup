import * as vscode from "vscode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import mime from "mime-types";
import pLimit from "p-limit";
import CryptoJS from "crypto-js";
import { ProfileManager, StorageProfile } from "./profile-manager";
import { registerProfileCommands } from "./profile-ui";
import { ProfileStatusBar } from "./status-bar";
import { UploadHistoryManager, NamingPatternRenderer } from "./upload-history";
import { registerHistoryCommands } from "./history-ui";

const cache = new Map<string, string>();

type StorageProvider = "cloudflare-r2" | "aws-s3" | "s3-compatible";

interface StorageConfig {
  provider: StorageProvider;
  endpoint: string | null;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  accountId: string | null;
  cdnDomain: string;
  pathPrefix: string;
}

function resolveStorageConfig(cfg: vscode.WorkspaceConfiguration): StorageConfig | null {
  // Use new generic settings
  const hasNewSettings = !!(cfg.get<string>("bucket") && cfg.get<string>("accessKey"));

  if (hasNewSettings) {
    // Use new generic settings
    const provider = (cfg.get<string>("storageProvider") || "s3-compatible") as StorageProvider;
    const bucket = cfg.get<string>("bucket")!;
    const accessKey = cfg.get<string>("accessKey")!;
    const secretKey = cfg.get<string>("secretKey")!;
    const cdnDomain = cfg.get<string>("cdnDomain")!;

    if (!bucket || !accessKey || !secretKey || !cdnDomain) {
      return null;
    }

    const accountId = cfg.get<string>("accountId") || null;
    const endpoint = cfg.get<string>("endpoint") || null;
    const region = cfg.get<string>("region") || "auto";
    const pathPrefix = cfg.get<string>("pathPrefix") || "blog";

    // Validate provider-specific requirements
    if (provider === "cloudflare-r2" && !accountId) {
      vscode.window.showErrorMessage("Cloudflare R2 requires accountId setting.");
      return null;
    }

    if (provider === "s3-compatible" && !endpoint) {
      vscode.window.showErrorMessage("S3-compatible provider requires endpoint setting.");
      return null;
    }

    return {
      provider,
      accountId,
      bucket,
      accessKey,
      secretKey,
      cdnDomain,
      endpoint,
      region,
      pathPrefix
    };
  }

  // No valid configuration
  return null;
}

function createS3Client(config: StorageConfig): S3Client {
  const clientConfig: any = {
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey
    }
  };

  switch (config.provider) {
    case "cloudflare-r2":
      clientConfig.region = "auto";
      clientConfig.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
      break;

    case "aws-s3":
      clientConfig.region = config.region;
      // No custom endpoint (use AWS SDK default)
      break;

    case "s3-compatible":
      clientConfig.region = config.region || "us-east-1";
      clientConfig.endpoint = config.endpoint;
      break;
  }

  return new S3Client(clientConfig);
}

function getProviderDisplayName(provider: StorageProvider): string {
  switch (provider) {
    case "cloudflare-r2": return "Cloudflare R2";
    case "aws-s3": return "AWS S3";
    case "s3-compatible": return "S3-compatible storage";
    default: return "cloud storage";
  }
}

export async function activate(context: vscode.ExtensionContext) {
  // Initialize ProfileManager
  const profileManager = new ProfileManager(context);
  await profileManager.initialize();

  // Initialize UploadHistoryManager
  const uploadHistory = new UploadHistoryManager(context);
  await uploadHistory.initialize();

  // Initialize NamingPatternRenderer
  const namingRenderer = new NamingPatternRenderer();

  // Register profile commands
  registerProfileCommands(context, profileManager);

  // Register history commands
  registerHistoryCommands(context, uploadHistory, profileManager);

  // Create status bar
  const statusBar = new ProfileStatusBar(profileManager);
  context.subscriptions.push(statusBar);
  await statusBar.update();

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration("mdimgup")) {
        await statusBar.update();
      }
    })
  );

  const cmd = vscode.commands.registerCommand("mdimgup.uploadImages", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Resolve profile (includes backward compatibility with legacy config)
    let profile = await profileManager.resolveProfile(editor);

    if (!profile) {
      // No profile found, prompt user to create or select one
      const action = await vscode.window.showInformationMessage(
        "No storage profile configured. Would you like to create or select one?",
        "Create Profile",
        "Select Profile",
        "Cancel"
      );

      if (action === "Create Profile") {
        await vscode.commands.executeCommand("mdimgup.createProfile");
        profile = await profileManager.resolveProfile(editor);
      } else if (action === "Select Profile") {
        await vscode.commands.executeCommand("mdimgup.selectProfile");
        profile = await profileManager.resolveProfile(editor);
      }

      if (!profile) {
        return;
      }
    }

    // Get credentials
    const profileWithCreds = await profileManager.getProfileWithCredentials(profile.id);
    if (!profileWithCreds) {
      vscode.window.showErrorMessage(
        `No credentials found for profile "${profile.name}". Please configure credentials.`
      );
      return;
    }

    const cfg = vscode.workspace.getConfiguration("mdimgup");
    const MAX_WIDTH = profile.maxWidth || cfg.get<number>("maxWidth")!;
    const PARALLEL = profile.parallelUploads || cfg.get<number>("parallelUploads")!;
    const USE_CACHE = profile.useCache !== undefined ? profile.useCache : cfg.get<boolean>("useCache")!;

    const storageConfig: StorageConfig = {
      provider: profile.provider,
      endpoint: profile.endpoint || null,
      region: profile.region,
      bucket: profile.bucket,
      accessKey: profileWithCreds.accessKey,
      secretKey: profileWithCreds.secretKey,
      accountId: profile.accountId || null,
      cdnDomain: profile.cdnDomain,
      pathPrefix: profile.pathPrefix,
    };

    const s3 = createS3Client(storageConfig);
    const providerName = getProviderDisplayName(storageConfig.provider);

    const docPath = editor.document.uri.fsPath;
    const mdDir = path.dirname(docPath);
    let content = editor.document.getText();

    const regex = /!\[.*?\]\((.*?)\)/g;
    const matches = [...content.matchAll(regex)];

    const limit = pLimit(PARALLEL);

    const tasks = matches.map(m => limit(async () => {
      // m[1] contains the raw content inside the parentheses. It may include
      // angle brackets, percent-encoding, or an optional title after the URL.
      const rawInside = (m[1] || "").trim();

      // Extract the URL part (strip angle brackets and any title)
      let urlPart = rawInside;
      if (urlPart.startsWith("<") && urlPart.endsWith(">")) {
        urlPart = urlPart.slice(1, -1).trim();
      }
      // If there's a title after the URL (e.g. url "title"), remove it.
      const titleMatch = urlPart.match(/\s+["'][\s\S]*["']\s*$/);
      if (titleMatch) {
        urlPart = urlPart.slice(0, titleMatch.index).trim();
      }

      // Keep the original/raw markdown text for replacement later
      const originalMarkdownUrl = rawInside;

      // Decode for filesystem operations only. Keep original for text replacement
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(urlPart);
      } catch (e) {
        // If decoding fails, fall back to raw url part
        decodedPath = urlPart;
      }

      if (decodedPath.startsWith("http")) {
        return;
      }

      const fullPath = path.isAbsolute(decodedPath) ? decodedPath : path.join(mdDir, decodedPath);
      if (!fs.existsSync(fullPath)) {
        return;
      }

      const buffer = fs.readFileSync(fullPath);
      const hash = CryptoJS.MD5(buffer.toString("base64")).toString();

      if (USE_CACHE && cache.has(hash)) {
        // Replace the original markdown URL (not the decoded path)
        content = content.split(originalMarkdownUrl).join(cache.get(hash)!);
        return;
      }

      let uploadBuffer = buffer;
      const ext = path.extname(fullPath).toLowerCase();
      if (ext !== ".gif") {
        const img = sharp(buffer);
        const meta = await img.metadata();
        await img.resize({ width: meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width });
        uploadBuffer = Buffer.from(await img.toBuffer());
      }

      // Generate filename using naming pattern
      const namingPattern = profile.namingPattern || "{timestamp}-{filename}{ext}";
      const renderedName = namingRenderer.render(namingPattern, {
        originalPath: fullPath,
        hash,
        profileName: profile.name,
      });

      const pathPrefix = storageConfig.pathPrefix;
      const key = `${pathPrefix}${pathPrefix ? '/' : ''}${renderedName}`;

      await s3.send(new PutObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
        Body: uploadBuffer,
        ContentType: mime.lookup(fullPath) || "image/octet-stream",
      }));

      const url = `${storageConfig.cdnDomain}${storageConfig.cdnDomain.endsWith('/') ? '' : '/'}${key}`;
      cache.set(hash, url);
      // Replace the original markdown URL occurrence(s) to preserve encoding/title
      content = content.split(originalMarkdownUrl).join(url);

      // Save to upload history
      await uploadHistory.addRecord({
        profileId: profile.id,
        profileName: profile.name,
        documentUri: editor.document.uri.toString(),
        originalPath: originalMarkdownUrl,
        uploadedUrl: url,
        uploadKey: key,
        fileSize: uploadBuffer.length,
        fileHash: hash,
      });
    }));

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Uploading images to ${profile.name} (${providerName})...`,
    }, () => Promise.all(tasks));

    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), content);
    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage(`✅ Uploaded ${matches.length} image(s) to ${profile.name}`);

    // Update status bar
    await statusBar.update();
  });

  // Upload with Profile Selection command
  const uploadWithProfileCmd = vscode.commands.registerCommand("mdimgup.uploadImagesWithProfile", async () => {
    // First, prompt for profile selection
    await vscode.commands.executeCommand("mdimgup.selectProfile");
    // Then execute normal upload
    await vscode.commands.executeCommand("mdimgup.uploadImages");
  });

  context.subscriptions.push(cmd, uploadWithProfileCmd);
}

export function deactivate() { }
