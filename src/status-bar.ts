import * as vscode from "vscode";
import { ProfileManager, StorageProfile } from "./profile-manager";

export class ProfileStatusBar {
  private statusBarItem: vscode.StatusBarItem;

  constructor(
    private profileManager: ProfileManager
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      -1
    );
    this.statusBarItem.command = "mdimgup.selectProfile";
    this.statusBarItem.show();
  }

  async update(): Promise<void> {
    const profile = await this.profileManager.resolveProfile();

    if (!profile) {
      this.statusBarItem.text = "$(database) No Profile";
      this.statusBarItem.tooltip = "Click to select a storage profile";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      const icon = this.getProviderIcon(profile.provider);
      this.statusBarItem.text = `${icon} ${profile.name}`;
      this.statusBarItem.tooltip = this.formatTooltip(profile);
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  private getProviderIcon(provider: string): string {
    switch (provider) {
      case "cloudflare-r2":
        return "☁️";
      case "aws-s3":
        return "📦";
      case "s3-compatible":
        return "🗄️";
      default:
        return "💾";
    }
  }

  private formatTooltip(profile: StorageProfile): string {
    const lines = [
      `Profile: ${profile.name}`,
      `Provider: ${this.getProviderDisplayName(profile.provider)}`,
      `Bucket: ${profile.bucket}`,
      `Region: ${profile.region}`,
      `CDN: ${profile.cdnDomain}`,
    ];

    if (profile.description) {
      lines.unshift(profile.description);
      lines.unshift("---");
    }

    lines.push("", "Click to switch profile");

    return lines.join("\n");
  }

  private getProviderDisplayName(provider: string): string {
    switch (provider) {
      case "cloudflare-r2":
        return "Cloudflare R2";
      case "aws-s3":
        return "AWS S3";
      case "s3-compatible":
        return "S3-Compatible";
      default:
        return "Unknown";
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
