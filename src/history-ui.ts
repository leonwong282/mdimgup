import * as vscode from "vscode";
import { UploadHistoryManager, UploadRecord } from "./upload-history";
import { ProfileManager } from "./profile-manager";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export function registerHistoryCommands(
  context: vscode.ExtensionContext,
  uploadHistory: UploadHistoryManager,
  profileManager: ProfileManager
): void {
  // View Upload History
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.viewHistory", async () => {
      await viewHistoryCommand(uploadHistory, profileManager);
    })
  );

  // Undo Last Upload
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.undoUpload", async () => {
      await undoUploadCommand(uploadHistory, profileManager);
    })
  );

  // Clear History
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.clearHistory", async () => {
      await clearHistoryCommand(uploadHistory);
    })
  );
}

async function viewHistoryCommand(
  uploadHistory: UploadHistoryManager,
  profileManager: ProfileManager
): Promise<void> {
  const records = await uploadHistory.getRecords({ limit: 100 });

  if (records.length === 0) {
    vscode.window.showInformationMessage("No upload history found");
    return;
  }

  interface HistoryItem extends vscode.QuickPickItem {
    record: UploadRecord;
  }

  const items: HistoryItem[] = records.map((record) => {
    const date = new Date(record.timestamp);
    const timeAgo = formatTimeAgo(date);
    const fileName = record.originalPath.split("/").pop() || record.originalPath;

    return {
      label: `$(cloud-upload) ${fileName}`,
      description: `${record.profileName} • ${formatBytes(record.fileSize)}`,
      detail: `${timeAgo} • ${record.uploadedUrl}`,
      record,
    };
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select an upload to view details or undo",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) {
    return;
  }

  // Show actions for the selected record
  const actions = [
    { label: "$(discard) Undo Upload", value: "undo" },
    { label: "$(link-external) Open URL", value: "open" },
    { label: "$(copy) Copy URL", value: "copy" },
    { label: "$(trash) Delete from History", value: "delete" },
    { label: "$(info) View Details", value: "details" },
  ];

  const action = await vscode.window.showQuickPick(actions, {
    placeHolder: `Actions for ${selected.record.originalPath}`,
  });

  if (!action) {
    return;
  }

  if (action.value === "undo") {
    await undoSpecificUpload(selected.record, uploadHistory, profileManager);
  } else if (action.value === "open") {
    vscode.env.openExternal(vscode.Uri.parse(selected.record.uploadedUrl));
  } else if (action.value === "copy") {
    await vscode.env.clipboard.writeText(selected.record.uploadedUrl);
    vscode.window.showInformationMessage("URL copied to clipboard");
  } else if (action.value === "delete") {
    await uploadHistory.deleteRecord(selected.record.id);
    vscode.window.showInformationMessage("Record deleted from history");
  } else if (action.value === "details") {
    showRecordDetails(selected.record);
  }
}

async function undoUploadCommand(
  uploadHistory: UploadHistoryManager,
  profileManager: ProfileManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  // Get recent uploads for this document
  const records = await uploadHistory.getRecords({
    documentUri: editor.document.uri.toString(),
    limit: 10,
  });

  if (records.length === 0) {
    vscode.window.showInformationMessage("No recent uploads found for this document");
    return;
  }

  interface UndoItem extends vscode.QuickPickItem {
    record: UploadRecord;
  }

  const items: UndoItem[] = records.map((record) => {
    const date = new Date(record.timestamp);
    const timeAgo = formatTimeAgo(date);
    const fileName = record.originalPath.split("/").pop() || record.originalPath;

    return {
      label: `$(history) ${fileName}`,
      description: timeAgo,
      detail: record.uploadedUrl,
      record,
    };
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select an upload to undo",
  });

  if (!selected) {
    return;
  }

  await undoSpecificUpload(selected.record, uploadHistory, profileManager);
}

async function undoSpecificUpload(
  record: UploadRecord,
  uploadHistory: UploadHistoryManager,
  profileManager: ProfileManager
): Promise<void> {
  const deleteFromStorage = await vscode.window.showQuickPick(
    [
      { label: "Revert link only", value: "link-only", picked: true },
      { label: "Revert link and delete from storage", value: "with-delete" },
    ],
    { placeHolder: "How would you like to undo this upload?" }
  );

  if (!deleteFromStorage) {
    return;
  }

  // Find and replace the URL in the document
  const docUri = vscode.Uri.parse(record.documentUri);
  const doc = await vscode.workspace.openTextDocument(docUri);
  const editor = await vscode.window.showTextDocument(doc);

  const text = doc.getText();
  const updatedText = text.replace(record.uploadedUrl, record.originalPath);

  if (text === updatedText) {
    vscode.window.showWarningMessage("Upload URL not found in document. It may have been manually edited.");
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(docUri, new vscode.Range(0, 0, doc.lineCount, 0), updatedText);
  await vscode.workspace.applyEdit(edit);

  // Delete from storage if requested
  if (deleteFromStorage.value === "with-delete") {
    try {
      const profile = await profileManager.getProfile(record.profileId);
      if (profile) {
        const profileWithCreds = await profileManager.getProfileWithCredentials(record.profileId);
        if (profileWithCreds) {
          const s3 = createS3ClientFromProfile(profile, profileWithCreds);
          await s3.send(
            new DeleteObjectCommand({
              Bucket: profile.bucket,
              Key: record.uploadKey,
            })
          );
          vscode.window.showInformationMessage(
            `✅ Reverted upload and deleted from ${profile.name}`
          );
        }
      }
    } catch (error) {
      vscode.window.showWarningMessage(
        `Link reverted, but failed to delete from storage: ${error}`
      );
    }
  } else {
    vscode.window.showInformationMessage("✅ Upload link reverted");
  }

  // Remove from history
  await uploadHistory.deleteRecord(record.id);
}

async function clearHistoryCommand(uploadHistory: UploadHistoryManager): Promise<void> {
  const options = [
    { label: "Clear all history", value: "all" },
    { label: "Clear history older than 30 days", value: "30days" },
    { label: "Clear history older than 90 days", value: "90days" },
    { label: "Cancel", value: "cancel" },
  ];

  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: "What would you like to clear?",
  });

  if (!selected || selected.value === "cancel") {
    return;
  }

  let deleted = 0;

  if (selected.value === "all") {
    const confirm = await vscode.window.showWarningMessage(
      "Are you sure you want to clear all upload history?",
      "Clear All",
      "Cancel"
    );
    if (confirm === "Clear All") {
      deleted = await uploadHistory.clearHistory();
    }
  } else if (selected.value === "30days") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    deleted = await uploadHistory.clearHistory({ olderThan: cutoff });
  } else if (selected.value === "90days") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    deleted = await uploadHistory.clearHistory({ olderThan: cutoff });
  }

  if (deleted > 0) {
    vscode.window.showInformationMessage(`Cleared ${deleted} record(s) from history`);
  }
}

function showRecordDetails(record: UploadRecord): void {
  const date = new Date(record.timestamp);
  const output = [
    "Upload Details",
    "==============",
    "",
    `Profile: ${record.profileName}`,
    `Uploaded: ${date.toLocaleString()}`,
    `Original Path: ${record.originalPath}`,
    `Upload URL: ${record.uploadedUrl}`,
    `Storage Key: ${record.uploadKey}`,
    `File Size: ${formatBytes(record.fileSize)}`,
    `Hash: ${record.fileHash}`,
    `Document: ${record.documentUri}`,
  ].join("\n");

  vscode.workspace.openTextDocument({ content: output, language: "plaintext" }).then((doc) => {
    vscode.window.showTextDocument(doc);
  });
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "just now";
  }
  if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1048576) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function createS3ClientFromProfile(profile: any, profileWithCreds: any): S3Client {
  const clientConfig: any = {
    credentials: {
      accessKeyId: profileWithCreds.accessKey,
      secretAccessKey: profileWithCreds.secretKey,
    },
  };

  switch (profile.provider) {
    case "cloudflare-r2":
      clientConfig.region = "auto";
      clientConfig.endpoint = `https://${profile.accountId}.r2.cloudflarestorage.com`;
      break;
    case "aws-s3":
      clientConfig.region = profile.region;
      break;
    case "s3-compatible":
      clientConfig.region = profile.region || "us-east-1";
      clientConfig.endpoint = profile.endpoint;
      break;
  }

  return new S3Client(clientConfig);
}
