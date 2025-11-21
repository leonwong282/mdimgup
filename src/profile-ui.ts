import * as vscode from "vscode";
import { ProfileManager, StorageProfile, StorageProvider } from "./profile-manager";

export function registerProfileCommands(context: vscode.ExtensionContext, profileManager: ProfileManager): void {
  // Create Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.createProfile", async () => {
      await createProfileWizard(profileManager);
    })
  );

  // Select Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.selectProfile", async () => {
      await selectProfileCommand(profileManager);
    })
  );

  // Quick Switch
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.quickSwitch", async () => {
      await selectProfileCommand(profileManager);
    })
  );

  // Edit Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.editProfile", async () => {
      await editProfileCommand(profileManager);
    })
  );

  // Delete Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.deleteProfile", async () => {
      await deleteProfileCommand(profileManager);
    })
  );

  // Duplicate Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.duplicateProfile", async () => {
      await duplicateProfileCommand(profileManager);
    })
  );

  // List Profiles
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.listProfiles", async () => {
      await listProfilesCommand(profileManager);
    })
  );

  // Import Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.importProfile", async () => {
      await importProfileCommand(profileManager);
    })
  );

  // Export Profile
  context.subscriptions.push(
    vscode.commands.registerCommand("mdimgup.exportProfile", async () => {
      await exportProfileCommand(profileManager);
    })
  );
}

// Profile Creation Wizard

async function createProfileWizard(profileManager: ProfileManager): Promise<StorageProfile | null> {
  // Step 1: Name
  const name = await vscode.window.showInputBox({
    prompt: "Enter profile name",
    placeHolder: "e.g., Production Blog, Staging R2, Client ABC",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Profile name is required";
      }
      if (value.length > 100) {
        return "Profile name must be 100 characters or less";
      }
      if (profileManager.hasProfile(value)) {
        return "A profile with this name already exists";
      }
      return null;
    },
  });

  if (!name) {
    return null;
  }

  // Step 2: Description (optional)
  const description = await vscode.window.showInputBox({
    prompt: "Enter profile description (optional)",
    placeHolder: "e.g., Main blog production bucket for images",
  });

  // Step 3: Provider Selection
  const providerItems = [
    { label: "$(cloud) Cloudflare R2", value: "cloudflare-r2" as StorageProvider },
    { label: "$(package) AWS S3", value: "aws-s3" as StorageProvider },
    { label: "$(database) S3-Compatible (MinIO, Spaces, etc.)", value: "s3-compatible" as StorageProvider },
  ];

  const selectedProvider = await vscode.window.showQuickPick(providerItems, {
    placeHolder: "Select storage provider",
  });

  if (!selectedProvider) {
    return null;
  }

  const provider = selectedProvider.value;

  // Step 4: Provider-Specific Settings
  const config = await collectProviderSettings(provider);
  if (!config) {
    return null;
  }

  // Step 5: Credentials
  const accessKey = await vscode.window.showInputBox({
    prompt: "Enter access key ID",
    password: true,
    validateInput: (value) => (value ? null : "Access key is required"),
  });

  if (!accessKey) {
    return null;
  }

  const secretKey = await vscode.window.showInputBox({
    prompt: "Enter secret access key",
    password: true,
    validateInput: (value) => (value ? null : "Secret key is required"),
  });

  if (!secretKey) {
    return null;
  }

  // Step 6: CDN Domain
  const cdnDomain = await vscode.window.showInputBox({
    prompt: "Enter CDN domain",
    placeHolder: "e.g., https://cdn.example.com",
    validateInput: (value) => {
      if (!value) {
        return "CDN domain is required";
      }
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        return "CDN domain must start with http:// or https://";
      }
      return null;
    },
  });

  if (!cdnDomain) {
    return null;
  }

  // Step 7: Path Prefix
  const pathPrefix = await vscode.window.showInputBox({
    prompt: "Enter path prefix (optional)",
    placeHolder: "e.g., blog, images, or leave empty for root",
    value: "blog",
  });

  // Step 8: Naming Pattern (optional)
  const useCustomPattern = await vscode.window.showQuickPick(
    [
      { label: "Use default pattern", value: "default" },
      { label: "Customize filename pattern", value: "custom" },
    ],
    { placeHolder: "Filename pattern (advanced)" }
  );

  let namingPattern: string | undefined;
  if (useCustomPattern?.value === "custom") {
    namingPattern = await vscode.window.showInputBox({
      prompt: "Enter naming pattern (e.g., {date}/{filename}-{hash:8}{ext})",
      placeHolder: "{timestamp}-{filename}{ext}",
      value: "{timestamp}-{filename}{ext}",
      validateInput: (value) => {
        const { NamingPatternRenderer } = require("./upload-history");
        const renderer = new NamingPatternRenderer();
        const validation = renderer.validate(value);
        return validation.valid ? null : validation.error;
      },
    });
  }

  // Create profile
  try {
    const profile = await profileManager.createProfile({
      name,
      description,
      provider,
      ...config,
      cdnDomain,
      pathPrefix: pathPrefix || "",
      namingPattern,
    });

    // Store credentials
    await profileManager.setCredentials(profile.id, { accessKey, secretKey });

    // Ask if user wants to set as active
    const setActive = await vscode.window.showInformationMessage(
      `Profile "${name}" created successfully!`,
      "Set as Active Profile",
      "Done"
    );

    if (setActive === "Set as Active Profile") {
      await profileManager.setActiveProfile(profile.id, "global");
    }

    return profile;
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create profile: ${error}`);
    return null;
  }
}

async function collectProviderSettings(provider: StorageProvider): Promise<any | null> {
  if (provider === "cloudflare-r2") {
    const accountId = await vscode.window.showInputBox({
      prompt: "Enter Cloudflare R2 account ID",
      placeHolder: "e.g., abc123...",
      validateInput: (value) => (value ? null : "Account ID is required for Cloudflare R2"),
    });

    if (!accountId) {
      return null;
    }

    const bucket = await vscode.window.showInputBox({
      prompt: "Enter bucket name",
      validateInput: (value) => (value ? null : "Bucket name is required"),
    });

    if (!bucket) {
      return null;
    }

    return {
      accountId,
      bucket,
      region: "auto",
    };
  } else if (provider === "aws-s3") {
    const region = await vscode.window.showInputBox({
      prompt: "Enter AWS region",
      placeHolder: "e.g., us-east-1, eu-west-1, ap-northeast-1",
      validateInput: (value) => (value ? null : "Region is required for AWS S3"),
    });

    if (!region) {
      return null;
    }

    const bucket = await vscode.window.showInputBox({
      prompt: "Enter bucket name",
      validateInput: (value) => (value ? null : "Bucket name is required"),
    });

    if (!bucket) {
      return null;
    }

    return {
      region,
      bucket,
    };
  } else if (provider === "s3-compatible") {
    const endpoint = await vscode.window.showInputBox({
      prompt: "Enter S3 endpoint URL",
      placeHolder: "e.g., https://minio.example.com, https://nyc3.digitaloceanspaces.com",
      validateInput: (value) => {
        if (!value) {
          return "Endpoint is required for S3-compatible providers";
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
          return "Endpoint must start with http:// or https://";
        }
        return null;
      },
    });

    if (!endpoint) {
      return null;
    }

    const region = await vscode.window.showInputBox({
      prompt: "Enter region (optional)",
      placeHolder: "e.g., us-east-1, or leave empty",
      value: "us-east-1",
    });

    const bucket = await vscode.window.showInputBox({
      prompt: "Enter bucket name",
      validateInput: (value) => (value ? null : "Bucket name is required"),
    });

    if (!bucket) {
      return null;
    }

    return {
      endpoint,
      region: region || "us-east-1",
      bucket,
    };
  }

  return null;
}

// Profile Selection

async function selectProfileCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();
  const activeProfile = await profileManager.getActiveProfile();

  if (profiles.length === 0) {
    const createNew = await vscode.window.showInformationMessage(
      "No profiles found. Would you like to create one?",
      "Create Profile",
      "Cancel"
    );

    if (createNew === "Create Profile") {
      await createProfileWizard(profileManager);
    }
    return;
  }

  // Sort by last used (most recent first)
  profiles.sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return bTime - aTime;
  });

  const items: vscode.QuickPickItem[] = profiles.map((p) => {
    const isActive = activeProfile?.id === p.id;
    const icon = getProviderIcon(p.provider);
    const label = isActive ? `$(star-full) ${p.name}` : p.name;
    const description = `${icon} ${p.bucket}`;
    const detail = p.lastUsed ? `Last used: ${formatRelativeTime(p.lastUsed)}` : "Never used";

    return {
      label,
      description,
      detail,
      profile: p,
    } as any;
  });

  items.push(
    { label: "$(add) Create New Profile", kind: vscode.QuickPickItemKind.Separator } as any,
    { label: "$(gear) Manage Profiles", kind: vscode.QuickPickItemKind.Separator } as any
  );

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select storage profile",
  });

  if (!selected) {
    return;
  }

  if (selected.label === "$(add) Create New Profile") {
    await createProfileWizard(profileManager);
  } else if (selected.label === "$(gear) Manage Profiles") {
    await listProfilesCommand(profileManager);
  } else if ((selected as any).profile) {
    const profile = (selected as any).profile as StorageProfile;
    await profileManager.setActiveProfile(profile.id, "global");
    vscode.window.showInformationMessage(`Active profile: ${profile.name}`);
  }
}

// Edit Profile

async function editProfileCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();

  if (profiles.length === 0) {
    vscode.window.showInformationMessage("No profiles to edit");
    return;
  }

  const items = profiles.map((p) => ({
    label: p.name,
    description: `${getProviderIcon(p.provider)} ${p.bucket}`,
    profile: p,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select profile to edit",
  });

  if (!selected) {
    return;
  }

  const profile = selected.profile as StorageProfile;

  const actions: vscode.QuickPickItem[] = [
    { label: "Rename profile" },
    { label: "Edit description" },
    { label: "Edit provider settings" },
    { label: "Edit CDN & Path Prefix" },
    { label: "Edit naming pattern" },
    { label: "Update credentials" },
    { label: "Set as Active Profile" },
    { label: "Cancel" },
  ];

  const action = await vscode.window.showQuickPick(actions, { placeHolder: `Modify "${profile.name}"` });
  if (!action || action.label === "Cancel") {
    return;
  }

  try {
    if (action.label === "Rename profile") {
      const newName = await vscode.window.showInputBox({
        prompt: "Enter new profile name",
        value: profile.name,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "Profile name is required";
          }
          if (value !== profile.name && profileManager.hasProfile(value)) {
            return "A profile with this name already exists";
          }
          return null;
        },
      });
      if (newName && newName !== profile.name) {
        await profileManager.updateProfile(profile.id, { name: newName });
        vscode.window.showInformationMessage(`Profile renamed to "${newName}"`);
      }
      return;
    }

    if (action.label === "Edit description") {
      const newDesc = await vscode.window.showInputBox({
        prompt: "Enter new description (optional)",
        value: profile.description || "",
      });
      await profileManager.updateProfile(profile.id, { description: newDesc || undefined });
      vscode.window.showInformationMessage("Description updated");
      return;
    }

    if (action.label === "Edit provider settings") {
      // Provider specific edits
      if (profile.provider === "cloudflare-r2") {
        const accountId = await vscode.window.showInputBox({
          prompt: "Cloudflare R2 Account ID",
          value: profile.accountId || "",
          validateInput: (v) => (v ? null : "Account ID required"),
        });
        if (!accountId) {
          return;
        }

        const bucket = await vscode.window.showInputBox({
          prompt: "Bucket name",
          value: profile.bucket || "",
          validateInput: (v) => (v ? null : "Bucket required"),
        });
        if (!bucket) {
          return;
        }

        await profileManager.updateProfile(profile.id, { accountId, bucket });
        vscode.window.showInformationMessage("Provider settings updated");
      } else if (profile.provider === "aws-s3") {
        const region = await vscode.window.showInputBox({
          prompt: "AWS region",
          value: profile.region || "",
          validateInput: (v) => (v ? null : "Region required"),
        });
        if (!region) {
          return;
        }

        const bucket = await vscode.window.showInputBox({
          prompt: "Bucket name",
          value: profile.bucket || "",
          validateInput: (v) => (v ? null : "Bucket required"),
        });
        if (!bucket) {
          return;
        }

        await profileManager.updateProfile(profile.id, { region, bucket });
        vscode.window.showInformationMessage("Provider settings updated");
      } else {
        // s3-compatible
        const endpoint = await vscode.window.showInputBox({
          prompt: "S3 endpoint URL",
          value: profile.endpoint || "",
          validateInput: (v) => {
            if (!v) {
              return "Endpoint required";
            }
            if (!v.startsWith("http://") && !v.startsWith("https://")) {
              return "Endpoint must start with http:// or https://";
            }
            return null;
          },
        });
        if (!endpoint) {
          return;
        }

        const bucket = await vscode.window.showInputBox({
          prompt: "Bucket name",
          value: profile.bucket || "",
          validateInput: (v) => (v ? null : "Bucket required"),
        });
        if (!bucket) {
          return;
        }

        const region = await vscode.window.showInputBox({
          prompt: "Region (optional)",
          value: profile.region || "",
        });

        await profileManager.updateProfile(profile.id, { endpoint, bucket, region: region || profile.region });
        vscode.window.showInformationMessage("Provider settings updated");
      }

      return;
    }

    if (action.label === "Edit CDN & Path Prefix") {
      const cdn = await vscode.window.showInputBox({
        prompt: "CDN domain",
        value: profile.cdnDomain || "",
        validateInput: (v) => {
          if (!v) {
            return "CDN domain is required";
          }
          if (!v.startsWith("http://") && !v.startsWith("https://")) {
            return "CDN domain must start with http:// or https://";
          }
          return null;
        },
      });
      if (!cdn) {
        return;
      }

      const prefix = await vscode.window.showInputBox({
        prompt: "Path prefix (optional)",
        value: profile.pathPrefix || "",
      });

      await profileManager.updateProfile(profile.id, { cdnDomain: cdn, pathPrefix: prefix || "" });
      vscode.window.showInformationMessage("CDN and path prefix updated");
      return;
    }

    if (action.label === "Edit naming pattern") {
      const { NamingPatternRenderer, NAMING_PATTERN_TEMPLATES } = require("./upload-history");
      const renderer = new NamingPatternRenderer();

      interface TemplateItem {
        label: string;
        description: string;
      }

      // Show template choices
      const templateItems: TemplateItem[] = NAMING_PATTERN_TEMPLATES.map((t: any) => ({
        label: t.pattern,
        description: t.description,
      }));
      templateItems.push({ label: "$(edit) Custom pattern", description: "Enter your own pattern" });

      const choice = await vscode.window.showQuickPick(templateItems, {
        placeHolder: `Current: ${profile.namingPattern || "{timestamp}-{filename}{ext}"}`,
      });

      if (!choice) {
        return;
      }

      let pattern: string;
      if (choice.label === "$(edit) Custom pattern") {
        const custom = await vscode.window.showInputBox({
          prompt: "Enter naming pattern",
          value: profile.namingPattern || "{timestamp}-{filename}{ext}",
          validateInput: (value) => {
            const validation = renderer.validate(value);
            return validation.valid ? null : validation.error;
          },
        });
        if (!custom) {
          return;
        }
        pattern = custom;
      } else {
        pattern = choice.label;
      }

      const example = renderer.getExample(pattern);
      const confirm = await vscode.window.showInformationMessage(
        `Example: ${example}\n\nUse this pattern?`,
        "Yes",
        "No"
      );

      if (confirm === "Yes") {
        await profileManager.updateProfile(profile.id, { namingPattern: pattern });
        vscode.window.showInformationMessage("Naming pattern updated");
      }
      return;
    }

    if (action.label === "Update credentials") {
      const accessKey = await vscode.window.showInputBox({
        prompt: "Enter access key ID",
        password: true,
        validateInput: (v) => (v ? null : "Access key required"),
      });
      if (!accessKey) {
        return;
      }

      const secretKey = await vscode.window.showInputBox({
        prompt: "Enter secret access key",
        password: true,
        validateInput: (v) => (v ? null : "Secret key required"),
      });
      if (!secretKey) {
        return;
      }

      await profileManager.setCredentials(profile.id, { accessKey, secretKey });
      vscode.window.showInformationMessage("Credentials updated and stored securely");
      return;
    }

    if (action.label === "Set as Active Profile") {
      await profileManager.setActiveProfile(profile.id, "global");
      vscode.window.showInformationMessage(`Active profile set to ${profile.name}`);
      return;
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to update profile: ${err}`);
  }
}

// Delete Profile

async function deleteProfileCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();

  if (profiles.length === 0) {
    vscode.window.showInformationMessage("No profiles to delete");
    return;
  }

  const items = profiles.map((p) => ({
    label: p.name,
    description: `${getProviderIcon(p.provider)} ${p.bucket}`,
    profile: p,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select profile to delete",
  });

  if (!selected) {
    return;
  }

  const profile = selected.profile;
  const activeProfile = await profileManager.getActiveProfile();
  const isActive = activeProfile?.id === profile.id;

  const warningMsg = isActive
    ? `Are you sure you want to delete "${profile.name}"? This is your active profile.`
    : `Are you sure you want to delete "${profile.name}"?`;

  const confirm = await vscode.window.showWarningMessage(warningMsg, "Delete", "Cancel");

  if (confirm === "Delete") {
    await profileManager.deleteProfile(profile.id);
    vscode.window.showInformationMessage(`Profile "${profile.name}" deleted`);
  }
}

// Duplicate Profile

async function duplicateProfileCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();

  if (profiles.length === 0) {
    vscode.window.showInformationMessage("No profiles to duplicate");
    return;
  }

  const items = profiles.map((p) => ({
    label: p.name,
    description: `${getProviderIcon(p.provider)} ${p.bucket}`,
    profile: p,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select profile to duplicate",
  });

  if (!selected) {
    return;
  }

  const profile = selected.profile;

  const newName = await vscode.window.showInputBox({
    prompt: "Enter name for duplicated profile",
    value: `${profile.name} (Copy)`,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Profile name is required";
      }
      if (profileManager.hasProfile(value)) {
        return "A profile with this name already exists";
      }
      return null;
    },
  });

  if (!newName) {
    return;
  }

  const newProfile = await profileManager.duplicateProfile(profile.id, newName);

  const addCredentials = await vscode.window.showInformationMessage(
    `Profile "${newName}" created. Note: Credentials were not copied for security reasons.`,
    "Add Credentials",
    "Done"
  );

  if (addCredentials === "Add Credentials") {
    const accessKey = await vscode.window.showInputBox({
      prompt: "Enter access key ID",
      password: true,
    });

    const secretKey = await vscode.window.showInputBox({
      prompt: "Enter secret access key",
      password: true,
    });

    if (accessKey && secretKey) {
      await profileManager.setCredentials(newProfile.id, { accessKey, secretKey });
      vscode.window.showInformationMessage("Credentials saved");
    }
  }
}

// List Profiles

async function listProfilesCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();
  const activeProfile = await profileManager.getActiveProfile();

  if (profiles.length === 0) {
    vscode.window.showInformationMessage("No profiles configured");
    return;
  }

  const output: string[] = ["Storage Profiles:", ""];

  for (const profile of profiles) {
    const isActive = activeProfile?.id === profile.id;
    const star = isActive ? "⭐ " : "   ";
    const icon = getProviderIcon(profile.provider);
    output.push(`${star}${profile.name}`);
    output.push(`   ${icon} ${getProviderDisplayName(profile.provider)}`);
    output.push(`   Bucket: ${profile.bucket}`);
    output.push(`   CDN: ${profile.cdnDomain}`);
    if (profile.lastUsed) {
      output.push(`   Last used: ${formatRelativeTime(profile.lastUsed)}`);
    }
    output.push("");
  }

  const doc = await vscode.workspace.openTextDocument({
    content: output.join("\n"),
    language: "plaintext",
  });
  await vscode.window.showTextDocument(doc);
}

// Import Profile

async function importProfileCommand(profileManager: ProfileManager): Promise<void> {
  const fileUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { "JSON files": ["json"] },
    title: "Select profile file to import",
  });

  if (!fileUris || fileUris.length === 0) {
    return;
  }

  try {
    const imported = await profileManager.importProfile(fileUris[0].fsPath);

    vscode.window.showInformationMessage(
      `Imported ${imported.length} profile(s). Don't forget to add credentials!`
    );

    // Prompt to add credentials for first imported profile
    if (imported.length > 0) {
      const addCreds = await vscode.window.showInformationMessage(
        `Add credentials for "${imported[0].name}"?`,
        "Yes",
        "Later"
      );

      if (addCreds === "Yes") {
        const accessKey = await vscode.window.showInputBox({
          prompt: "Enter access key ID",
          password: true,
        });

        const secretKey = await vscode.window.showInputBox({
          prompt: "Enter secret access key",
          password: true,
        });

        if (accessKey && secretKey) {
          await profileManager.setCredentials(imported[0].id, { accessKey, secretKey });
          vscode.window.showInformationMessage("Credentials saved");
        }
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to import profile: ${error}`);
  }
}

// Export Profile

async function exportProfileCommand(profileManager: ProfileManager): Promise<void> {
  const profiles = await profileManager.listProfiles();

  if (profiles.length === 0) {
    vscode.window.showInformationMessage("No profiles to export");
    return;
  }

  const items = profiles.map((p) => ({
    label: p.name,
    description: `${getProviderIcon(p.provider)} ${p.bucket}`,
    profile: p,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select profile to export",
  });

  if (!selected) {
    return;
  }

  const fileUri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`${selected.profile.name.toLowerCase().replace(/\s+/g, "-")}.json`),
    filters: { "JSON files": ["json"] },
    title: "Export profile",
  });

  if (!fileUri) {
    return;
  }

  try {
    await profileManager.exportProfile(selected.profile.id, fileUri.fsPath);
    vscode.window.showInformationMessage(
      `Profile exported to ${fileUri.fsPath}. Note: Credentials were not included for security.`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to export profile: ${error}`);
  }
}

// Helper Functions

function getProviderIcon(provider: StorageProvider): string {
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

function getProviderDisplayName(provider: StorageProvider): string {
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

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
