import * as vscode from "vscode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import mime from "mime-types";
import pLimit from "p-limit";
import CryptoJS from "crypto-js";

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
  // Check if legacy R2 settings exist
  const hasLegacyR2 = !!(cfg.get<string>("r2AccountId") && cfg.get<string>("r2Bucket"));

  // Check if new generic settings exist
  const hasNewSettings = !!(cfg.get<string>("bucket") && cfg.get<string>("accessKey"));

  if (!hasNewSettings && hasLegacyR2) {
    // Use legacy R2 settings (backward compatibility)
    const accountId = cfg.get<string>("r2AccountId")!;
    const bucket = cfg.get<string>("r2Bucket")!;
    const accessKey = cfg.get<string>("r2AccessKey")!;
    const secretKey = cfg.get<string>("r2SecretKey")!;
    const cdnDomain = cfg.get<string>("r2Domain")!;

    if (!accountId || !bucket || !accessKey || !secretKey || !cdnDomain) {
      return null;
    }

    return {
      provider: "cloudflare-r2",
      accountId,
      bucket,
      accessKey,
      secretKey,
      cdnDomain,
      endpoint: null,
      region: "auto",
      pathPrefix: cfg.get<string>("pathPrefix") || "blog"
    };
  }

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
  const cmd = vscode.commands.registerCommand("mdimgup.uploadImages", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const cfg = vscode.workspace.getConfiguration("mdimgup");
    const storageConfig = resolveStorageConfig(cfg);

    if (!storageConfig) {
      vscode.window.showErrorMessage(
        "Storage configuration missing. Please configure your storage provider settings in VS Code settings."
      );
      return;
    }

    const MAX_WIDTH = cfg.get<number>("maxWidth")!;
    const PARALLEL = cfg.get<number>("parallelUploads")!;
    const USE_CACHE = cfg.get<boolean>("useCache")!;

    const s3 = createS3Client(storageConfig);
    const providerName = getProviderDisplayName(storageConfig.provider);

    const docPath = editor.document.uri.fsPath;
    const mdDir = path.dirname(docPath);
    let content = editor.document.getText();

    const regex = /!\[.*?\]\((.*?)\)/g;
    const matches = [...content.matchAll(regex)];

    const limit = pLimit(PARALLEL);

    const tasks = matches.map(m => limit(async () => {
      let imgPath = decodeURIComponent(m[1]);
      if (imgPath.startsWith("http")) return;
      const fullPath = path.isAbsolute(imgPath) ? imgPath : path.join(mdDir, imgPath);
      if (!fs.existsSync(fullPath)) return;

      const buffer = fs.readFileSync(fullPath);
      const hash = CryptoJS.MD5(buffer.toString("base64")).toString();

      if (USE_CACHE && cache.has(hash)) {
        content = content.replace(imgPath, cache.get(hash)!);
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

      const pathPrefix = storageConfig.pathPrefix;
      const key = `${pathPrefix}${pathPrefix ? '/' : ''}${Date.now()}-${path.basename(fullPath)}`;
      await s3.send(new PutObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
        Body: uploadBuffer,
        ContentType: mime.lookup(fullPath) || "image/octet-stream",
      }));

      const url = `${storageConfig.cdnDomain}${storageConfig.cdnDomain.endsWith('/') ? '' : '/'}${key}`;
      cache.set(hash, url);
      content = content.replace(imgPath, url);
    }));

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Uploading images to ${providerName}...`,
    }, () => Promise.all(tasks));

    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), content);
    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage(`✅ Uploaded ${matches.length} image(s) to ${providerName}`);
  });

  context.subscriptions.push(cmd);
}

export function deactivate() { }
