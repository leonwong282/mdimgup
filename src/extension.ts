import * as vscode from "vscode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import mime from "mime-types";
import pLimit from "p-limit";
import CryptoJS from "crypto-js";

const cache = new Map<string, string>();

export async function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand("mdimgup.uploadImages", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const cfg = vscode.workspace.getConfiguration("mdimgup");
    const R2_ACCOUNT_ID = cfg.get<string>("r2AccountId");
    const R2_BUCKET = cfg.get<string>("r2Bucket");
    const R2_ACCESS_KEY = cfg.get<string>("r2AccessKey");
    const R2_SECRET_KEY = cfg.get<string>("r2SecretKey");
    const R2_DOMAIN = cfg.get<string>("r2Domain");
    const MAX_WIDTH = cfg.get<number>("maxWidth")!;
    const PARALLEL = cfg.get<number>("parallelUploads")!;
    const USE_CACHE = cfg.get<boolean>("useCache")!;

    if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_DOMAIN) {
      vscode.window.showErrorMessage("R2 config missing — fill settings first.");
      return;
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY }
    });

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

      const key = `blog/${Date.now()}-${path.basename(fullPath)}`;
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: uploadBuffer,
        ContentType: mime.lookup(fullPath) || "image/octet-stream",
      }));

      const url = `${R2_DOMAIN}/${key}`;
      cache.set(hash, url);
      content = content.replace(imgPath, url);
    }));

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Uploading images to R2...",
    }, () => Promise.all(tasks));

    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), content);
    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage(`✅ Image upload complete (${matches.length})`);
  });

  context.subscriptions.push(cmd);
}

export function deactivate() { }
