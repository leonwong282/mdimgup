import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";

export type StorageProvider = "cloudflare-r2" | "aws-s3" | "s3-compatible";

export interface StorageProfile {
  // Identity
  id: string;
  name: string;
  description?: string;

  // Storage Configuration
  provider: StorageProvider;
  endpoint?: string;
  region: string;
  bucket: string;
  accountId?: string;

  // CDN & Upload Settings
  cdnDomain: string;
  pathPrefix: string;

  // Upload Behavior (optional overrides)
  maxWidth?: number;
  parallelUploads?: number;
  useCache?: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

interface ProfileCredentials {
  accessKey: string;
  secretKey: string;
}

export class ProfileManager {
  private profiles: Map<string, StorageProfile> = new Map();
  private activeProfileId: string | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    // Load profiles from globalState
    const storedProfiles = this.context.globalState.get<StorageProfile[]>("mdimgup.profiles", []);
    for (const profile of storedProfiles) {
      this.profiles.set(profile.id, profile);
    }

    // Load active profile from settings
    const config = vscode.workspace.getConfiguration("mdimgup");
    this.activeProfileId = config.get<string>("activeProfile") || null;

    // Check if migration is needed
    if (this.profiles.size === 0) {
      await this.migrateLegacyConfig();
    }
  }

  // Profile CRUD Operations

  async createProfile(
    profileData: Omit<StorageProfile, "id" | "createdAt" | "updatedAt">
  ): Promise<StorageProfile> {
    const now = new Date().toISOString();
    const profile: StorageProfile = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      ...profileData,
    };

    this.profiles.set(profile.id, profile);
    await this.saveProfiles();

    return profile;
  }

  async getProfile(id: string): Promise<StorageProfile | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id: string, updates: Partial<StorageProfile>): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    const updatedProfile: StorageProfile = {
      ...profile,
      ...updates,
      id: profile.id, // Prevent ID change
      createdAt: profile.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(id, updatedProfile);
    await this.saveProfiles();
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    // Delete profile
    this.profiles.delete(id);
    await this.saveProfiles();

    // Delete credentials
    await this.deleteCredentials(id);

    // If this was the active profile, clear it
    if (this.activeProfileId === id) {
      this.activeProfileId = null;
      await this.setActiveProfileId(null, "global");
    }
  }

  async listProfiles(): Promise<StorageProfile[]> {
    return Array.from(this.profiles.values());
  }

  async duplicateProfile(id: string, newName: string): Promise<StorageProfile> {
    const originalProfile = this.profiles.get(id);
    if (!originalProfile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...profileData } = originalProfile;

    return await this.createProfile({
      ...profileData,
      name: newName,
    });
  }

  hasProfile(name: string): boolean {
    return Array.from(this.profiles.values()).some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Profile Selection & Activation

  async setActiveProfile(id: string, scope: "global" | "workspace" | "folder"): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    // Update lastUsed timestamp
    await this.updateProfile(id, { lastUsed: new Date().toISOString() });

    if (scope === "global") {
      this.activeProfileId = id;
      await this.setActiveProfileId(id, "global");
    } else if (scope === "workspace") {
      await this.setActiveProfileId(id, "workspace");
    }
    // Folder scope not fully implemented yet (requires multi-root workspace handling)
  }

  async getActiveProfile(): Promise<StorageProfile | null> {
    if (!this.activeProfileId) {
      return null;
    }
    return this.profiles.get(this.activeProfileId) || null;
  }

  async resolveProfile(editor?: vscode.TextEditor): Promise<StorageProfile | null> {
    // 1. Check workspace-specific profile
    if (vscode.workspace.workspaceFolders?.[0]) {
      const workspaceProfileId = await this.getWorkspaceActiveProfile();
      if (workspaceProfileId) {
        const profile = this.profiles.get(workspaceProfileId);
        if (profile) {
          return profile;
        }
      }
    }

    // 2. Check global active profile
    if (this.activeProfileId) {
      const profile = this.profiles.get(this.activeProfileId);
      if (profile) {
        return profile;
      }
    }

    // 3. Fallback to legacy config
    return await this.resolveLegacyConfig();
  }

  // Credentials Management

  async setCredentials(profileId: string, credentials: ProfileCredentials): Promise<void> {
    const key = `mdimgup.profile.${profileId}.credentials`;
    await this.context.secrets.store(key, JSON.stringify(credentials));
  }

  async getCredentials(profileId: string): Promise<ProfileCredentials | null> {
    const key = `mdimgup.profile.${profileId}.credentials`;
    const stored = await this.context.secrets.get(key);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  async deleteCredentials(profileId: string): Promise<void> {
    const key = `mdimgup.profile.${profileId}.credentials`;
    await this.context.secrets.delete(key);
  }

  // Import/Export

  async exportProfile(id: string, filePath: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: "mdimgup",
      profiles: [
        {
          ...profile,
          _credentials: "REQUIRED: Add accessKey and secretKey when importing",
        },
      ],
      _notice:
        "Credentials are NOT included in this export for security. You must configure them after importing.",
    };

    const fs = require("fs");
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  }

  async importProfile(filePath: string): Promise<StorageProfile[]> {
    const fs = require("fs");
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!data.profiles || !Array.isArray(data.profiles)) {
      throw new Error("Invalid profile file format");
    }

    const importedProfiles: StorageProfile[] = [];

    for (const profileData of data.profiles) {
      // Remove export-specific fields
      const { _credentials, id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...cleanData } = profileData;

      // Check for name conflicts
      let name = cleanData.name;
      let counter = 1;
      while (this.hasProfile(name)) {
        name = `${cleanData.name} (${counter})`;
        counter++;
      }

      const profile = await this.createProfile({
        ...cleanData,
        name,
      });

      importedProfiles.push(profile);
    }

    return importedProfiles;
  }

  // Validation

  async validateProfile(profile: Partial<StorageProfile>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!profile.name || profile.name.trim().length === 0) {
      errors.push("Profile name is required");
    }

    if (!profile.provider) {
      errors.push("Storage provider is required");
    }

    if (!profile.bucket) {
      errors.push("Bucket name is required");
    }

    if (!profile.cdnDomain) {
      errors.push("CDN domain is required");
    }

    // Provider-specific validation
    if (profile.provider === "cloudflare-r2" && !profile.accountId) {
      errors.push("Cloudflare R2 requires account ID");
    }

    if (profile.provider === "s3-compatible" && !profile.endpoint) {
      errors.push("S3-compatible provider requires endpoint URL");
    }

    if (profile.provider === "aws-s3" && !profile.region) {
      errors.push("AWS S3 requires region");
    }

    return { valid: errors.length === 0, errors };
  }

  // Migration from Legacy Config

  async migrateLegacyConfig(): Promise<StorageProfile | null> {
    const cfg = vscode.workspace.getConfiguration("mdimgup");

    const hasLegacyR2 = !!(cfg.get<string>("r2AccountId") && cfg.get<string>("r2Bucket"));
    const hasNewSettings = !!(cfg.get<string>("bucket") && cfg.get<string>("accessKey"));

    if (!hasLegacyR2 && !hasNewSettings) {
      return null;
    }

    let profile: StorageProfile;

    if (hasLegacyR2) {
      // Migrate legacy R2 settings
      profile = await this.createProfile({
        name: "Default (Legacy)",
        description: "Migrated from legacy R2 configuration",
        provider: "cloudflare-r2",
        accountId: cfg.get<string>("r2AccountId")!,
        bucket: cfg.get<string>("r2Bucket")!,
        region: "auto",
        cdnDomain: cfg.get<string>("r2Domain")!,
        pathPrefix: cfg.get<string>("pathPrefix") || "blog",
      });

      await this.setCredentials(profile.id, {
        accessKey: cfg.get<string>("r2AccessKey")!,
        secretKey: cfg.get<string>("r2SecretKey")!,
      });
    } else {
      // Migrate new generic settings
      const provider = (cfg.get<string>("storageProvider") || "s3-compatible") as StorageProvider;

      profile = await this.createProfile({
        name: "Default (Legacy)",
        description: "Migrated from legacy configuration",
        provider,
        accountId: cfg.get<string>("accountId") || undefined,
        bucket: cfg.get<string>("bucket")!,
        region: cfg.get<string>("region") || "auto",
        endpoint: cfg.get<string>("endpoint") || undefined,
        cdnDomain: cfg.get<string>("cdnDomain")!,
        pathPrefix: cfg.get<string>("pathPrefix") || "blog",
      });

      await this.setCredentials(profile.id, {
        accessKey: cfg.get<string>("accessKey")!,
        secretKey: cfg.get<string>("secretKey")!,
      });
    }

    // Set as active profile
    await this.setActiveProfile(profile.id, "global");

    return profile;
  }

  async resolveLegacyConfig(): Promise<StorageProfile | null> {
    const cfg = vscode.workspace.getConfiguration("mdimgup");

    const hasLegacyR2 = !!(cfg.get<string>("r2AccountId") && cfg.get<string>("r2Bucket"));
    const hasNewSettings = !!(cfg.get<string>("bucket") && cfg.get<string>("accessKey"));

    if (!hasLegacyR2 && !hasNewSettings) {
      return null;
    }

    if (hasLegacyR2) {
      return {
        id: "legacy-r2",
        name: "Legacy R2 Configuration",
        provider: "cloudflare-r2",
        accountId: cfg.get<string>("r2AccountId")!,
        bucket: cfg.get<string>("r2Bucket")!,
        region: "auto",
        cdnDomain: cfg.get<string>("r2Domain")!,
        pathPrefix: cfg.get<string>("pathPrefix") || "blog",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const provider = (cfg.get<string>("storageProvider") || "s3-compatible") as StorageProvider;
    return {
      id: "legacy-generic",
      name: "Legacy Configuration",
      provider,
      accountId: cfg.get<string>("accountId") || undefined,
      bucket: cfg.get<string>("bucket")!,
      region: cfg.get<string>("region") || "auto",
      endpoint: cfg.get<string>("endpoint") || undefined,
      cdnDomain: cfg.get<string>("cdnDomain")!,
      pathPrefix: cfg.get<string>("pathPrefix") || "blog",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getProfileWithCredentials(profileId: string): Promise<(StorageProfile & ProfileCredentials) | null> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      return null;
    }

    // For legacy profiles, get credentials from settings
    if (profileId.startsWith("legacy-")) {
      const cfg = vscode.workspace.getConfiguration("mdimgup");
      if (profileId === "legacy-r2") {
        return {
          ...profile,
          accessKey: cfg.get<string>("r2AccessKey")!,
          secretKey: cfg.get<string>("r2SecretKey")!,
        };
      } else {
        return {
          ...profile,
          accessKey: cfg.get<string>("accessKey")!,
          secretKey: cfg.get<string>("secretKey")!,
        };
      }
    }

    const credentials = await this.getCredentials(profileId);
    if (!credentials) {
      return null;
    }

    return {
      ...profile,
      ...credentials,
    };
  }

  // Private Helper Methods

  private async saveProfiles(): Promise<void> {
    const profiles = Array.from(this.profiles.values());
    await this.context.globalState.update("mdimgup.profiles", profiles);
  }

  private async setActiveProfileId(id: string | null, scope: "global" | "workspace"): Promise<void> {
    const config = vscode.workspace.getConfiguration("mdimgup");
    await config.update("activeProfile", id, scope === "global" ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace);
  }

  private async getWorkspaceActiveProfile(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("mdimgup");
    return config.get<string>("activeProfile") || null;
  }
}
