# Requirements Document: Multi-Profile Storage Configuration

**Document Version:** 1.0  
**Date:** November 19, 2025  
**Author:** AI Assistant  
**Status:** Draft for Review  
**Related Document:** REQUIREMENTS.md (S3-Compatible Storage Support)

---

## Executive Summary

The mdimgup VS Code extension currently supports multiple S3-compatible storage providers but only allows **one active configuration at a time**. Users with multiple storage services (e.g., production and development buckets, different projects, multiple clients) must manually switch settings, which is error-prone and inefficient. This document outlines requirements for a **multi-profile system** that enables users to:

1. Define multiple named storage profiles
2. Quickly switch between profiles
3. Set default profiles per workspace/folder
4. Optionally select profiles at upload time

---

## 1. Problem Statement

### 1.1 Current Limitations

**Single Configuration Model:**
```json
{
  "mdimgup.storageProvider": "aws-s3",
  "mdimgup.region": "us-east-1",
  "mdimgup.bucket": "blog-production",
  "mdimgup.accessKey": "...",
  "mdimgup.secretKey": "...",
  "mdimgup.cdnDomain": "https://cdn.example.com"
}
```

**Pain Points:**
1. **No Multi-Environment Support**
   - User has production and staging buckets
   - Must manually edit settings to switch
   - High risk of uploading to wrong environment

2. **No Multi-Client/Project Support**
   - Freelancer working on multiple client projects
   - Each client has different storage service
   - Must remember and reconfigure for each project

3. **No Quick Switching**
   - Changing provider requires navigating settings UI
   - Copy-pasting credentials between notes/password manager
   - Time-consuming and error-prone

4. **No Workspace-Specific Defaults**
   - User has multiple workspaces (blog, documentation, client projects)
   - Each workspace should use different storage
   - Currently must change global settings

5. **Configuration Management Overhead**
   - Credentials stored only in VS Code settings
   - No easy backup/restore of profiles
   - Difficult to share profile templates (without credentials)

### 1.2 User Stories

**Story 1: Development vs. Production**
> "As a developer, I want to upload test images to my staging bucket and production images to my production bucket, so I can safely test without affecting live content."

**Story 2: Multi-Client Freelancer**
> "As a freelancer, I work on 5 different client projects with different storage services. I want to switch profiles easily without reconfiguring credentials every time."

**Story 3: Self-Hosted and Cloud**
> "I use MinIO for local development and Cloudflare R2 for production. I want to test uploads locally before deploying."

**Story 4: Multiple Blogs**
> "I maintain 3 personal blogs with different S3 buckets. I want each workspace to automatically use the correct profile."

**Story 5: Team Collaboration**
> "My team has shared development credentials and individual production credentials. I want to import/export profile templates without sharing secrets."

---

## 2. Goals & Success Criteria

### 2.1 Primary Goals

1. **Enable Multiple Profiles** — Users can define unlimited named storage profiles
2. **Quick Profile Switching** — Switch active profile in <3 clicks
3. **Workspace-Aware Defaults** — Auto-select profile based on workspace/folder
4. **Backward Compatibility** — Existing single-config users see no breaking changes
5. **Secure Credential Management** — Maintain current security posture (no degradation)

### 2.2 Success Criteria

- [x] Users can define 10+ profiles without performance degradation
- [x] Profile switching takes <5 seconds
- [x] Zero breaking changes for existing users
- [x] Migration from single-config to multi-profile is optional and seamless
- [x] Profile configuration UI is intuitive (user testing feedback: >80% satisfaction)
- [x] Credentials remain secure in VS Code Secret Storage API

### 2.3 Non-Goals (Out of Scope)

- ❌ Profile synchronization across devices (use VS Code Settings Sync)
- ❌ Cloud-based credential storage (use VS Code Secret Storage)
- ❌ Profile-specific upload history/analytics
- ❌ Automatic provider detection from bucket URL
- ❌ OAuth/SSO authentication flows

---

## 3. Functional Requirements

### 3.1 Profile Data Model

**FR-1.1: Profile Structure**

```typescript
interface StorageProfile {
  // Identity
  id: string;                    // Unique identifier (UUID)
  name: string;                  // User-friendly name (e.g., "Production Blog")
  description?: string;          // Optional description
  
  // Storage Configuration
  provider: StorageProvider;     // "cloudflare-r2" | "aws-s3" | "s3-compatible"
  endpoint?: string;             // Custom endpoint (for s3-compatible)
  region: string;                // AWS region or "auto"
  bucket: string;                // Bucket/container name
  accountId?: string;            // Cloudflare R2 account ID
  
  // Credentials (stored separately in Secret Storage)
  accessKey: string;             
  secretKey: string;             
  
  // CDN & Upload Settings
  cdnDomain: string;             // CDN domain for uploaded images
  pathPrefix: string;            // Upload path prefix (default: "blog")
  
  // Upload Behavior (optional overrides)
  maxWidth?: number;             // Override global maxWidth
  parallelUploads?: number;      // Override global parallelUploads
  useCache?: boolean;            // Override global useCache
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  lastUsed?: string;             // ISO 8601 timestamp
}
```

**FR-1.2: Profile Storage**

- **Location**: `globalState` (extension global storage)
- **Key**: `mdimgup.profiles`
- **Format**: JSON array of `StorageProfile` objects
- **Credentials**: Stored separately in VS Code Secret Storage API
  - Key pattern: `mdimgup.profile.${profileId}.credentials`
  - Value: `{ accessKey: string, secretKey: string }`

**FR-1.3: Profile Limits**

- Maximum profiles: 50 (soft limit, warn at 25)
- Profile name length: 1-100 characters
- Profile description length: 0-500 characters
- Profile ID: UUID v4 format

### 3.2 Profile Management Commands

**FR-2.1: Create Profile**

- Command: `mdimgup.createProfile`
- Title: "Create New Storage Profile"
- Input Flow:
  1. Profile name (required, unique)
  2. Description (optional)
  3. Storage provider selection (dropdown)
  4. Provider-specific settings (dynamic form)
  5. Credentials (access key, secret key)
  6. CDN domain
  7. Path prefix (default: "blog")
  8. Preview configuration
  9. Confirm and save

**FR-2.2: Edit Profile**

- Command: `mdimgup.editProfile`
- Title: "Edit Storage Profile"
- Shows Quick Pick of existing profiles
- Opens input flow similar to create (pre-filled)
- Option to test connection before saving

**FR-2.3: Delete Profile**

- Command: `mdimgup.deleteProfile`
- Title: "Delete Storage Profile"
- Shows Quick Pick of existing profiles
- Confirmation dialog with profile name
- Cascade delete credentials from Secret Storage
- Warn if profile is set as default

**FR-2.4: Duplicate Profile**

- Command: `mdimgup.duplicateProfile`
- Title: "Duplicate Storage Profile"
- Shows Quick Pick of existing profiles
- Creates copy with "(Copy)" suffix
- User enters new name
- **Does NOT copy credentials** (user must re-enter)

**FR-2.5: List Profiles**

- Command: `mdimgup.listProfiles`
- Title: "List Storage Profiles"
- Shows all profiles with:
  - Name
  - Provider icon
  - Bucket name
  - Last used timestamp
  - "⭐" indicator for default profile

**FR-2.6: Import/Export Profiles**

**Export:**
- Command: `mdimgup.exportProfile`
- Exports profile(s) to JSON file
- **Excludes credentials** (security)
- Includes all other configuration
- Use case: Share profile template with team

**Import:**
- Command: `mdimgup.importProfile`
- Imports profile(s) from JSON file
- Validates schema
- Prompts for credentials
- Checks for name conflicts
- Option to rename on import

### 3.3 Profile Selection & Activation

**FR-3.1: Active Profile Concept**

- **Global Active Profile**: Current profile for user's entire VS Code instance
- **Workspace Active Profile**: Override for specific workspace (highest priority)
- **Folder Active Profile**: Override for specific folder in multi-root workspace

**FR-3.2: Profile Selection Command**

- Command: `mdimgup.selectProfile`
- Title: "Select Storage Profile"
- Shows Quick Pick with:
  - Profile name
  - Provider + bucket info
  - Last used timestamp
  - Icon indicating current active profile
- Options:
  - Set as global default
  - Set as workspace default
  - Use once (temporary selection)

**FR-3.3: Profile Resolution Order**

```
1. Temporary selection (current upload command)
2. Folder-specific active profile (multi-root workspace)
3. Workspace-specific active profile
4. Global active profile
5. Fallback to legacy single-config settings
6. Error: No configuration found
```

**FR-3.4: Quick Profile Switch**

- Command: `mdimgup.quickSwitch`
- Keybinding: `Ctrl+Alt+P` (Windows/Linux) or `Cmd+Alt+P` (macOS)
- Shows Quick Pick with frecency sorting (most recently used first)
- Sets as active profile immediately

### 3.4 Upload Command Integration

**FR-4.1: Modified Upload Command**

- Command: `mdimgup.uploadImages` (existing)
- Behavior:
  1. Resolve active profile using resolution order
  2. If no profile found, show profile selection Quick Pick
  3. Option to remember choice as default
  4. Proceed with upload using selected profile
  5. Update `lastUsed` timestamp

**FR-4.2: Upload with Profile Selection**

- Command: `mdimgup.uploadImagesWithProfile` (new)
- Title: "Upload Images to Specific Profile"
- Always prompts for profile selection
- Does not change active profile
- Use case: One-off upload to different environment

**FR-4.3: Upload Progress Notifications**

- Include profile name in notification:
  - "Uploading images to [Profile Name] (AWS S3)..."
  - "✅ Uploaded 5 image(s) to [Profile Name]"

### 3.5 Backward Compatibility Layer

**FR-5.1: Legacy Configuration Detection**

```typescript
function resolveLegacyConfig(): StorageProfile | null {
  const cfg = vscode.workspace.getConfiguration("mdimgup");
  
  // Check for legacy single-config settings
  const hasLegacyR2 = !!(cfg.get<string>("r2AccountId") && cfg.get<string>("r2Bucket"));
  const hasNewSettings = !!(cfg.get<string>("bucket") && cfg.get<string>("accessKey"));
  
  if (hasLegacyR2 || hasNewSettings) {
    // Convert to temporary profile
    return {
      id: "legacy-default",
      name: "Default Profile (Legacy)",
      // ... map settings to StorageProfile
    };
  }
  
  return null;
}
```

**FR-5.2: Migration Prompt**

- Trigger: When legacy config detected and no profiles exist
- Message: "Convert your current configuration to a named profile?"
- Actions:
  - "Create Profile" → Opens create profile dialog (pre-filled)
  - "Not Now" → Continue using legacy config (no nag)
  - "Don't Ask Again" → Persist preference

**FR-5.3: Coexistence Rules**

- If profiles exist AND legacy config exists:
  - Profiles take precedence
  - Legacy config used as fallback (lowest priority)
  - Show info message once: "You have both profiles and legacy config. Consider migrating."

### 3.6 Status Bar Integration

**FR-6.1: Status Bar Item**

- Position: Right side, before language mode
- Text: `📦 [Profile Name]`
- Tooltip: Full profile details (provider, bucket, region)
- Click behavior: Opens `mdimgup.selectProfile` Quick Pick

**FR-6.2: Status Bar States**

- **Active Profile**: `📦 Production Blog`
- **No Profile**: `📦 No Profile` (click to select)
- **Legacy Config**: `📦 Default (Legacy)` (click to migrate)
- **Error State**: `⚠️ Profile Error` (click to fix)

### 3.7 Settings UI Integration

**FR-7.1: Settings Organization**

```json
{
  "mdimgup.activeProfile": "uuid-of-active-profile",
  "mdimgup.workspaceProfiles": {
    "/path/to/workspace1": "uuid-profile-1",
    "/path/to/workspace2": "uuid-profile-2"
  },
  "mdimgup.folderProfiles": {
    "/path/to/folder1": "uuid-profile-3"
  }
}
```

**FR-7.2: Settings UI Panel**

- Add "Profiles" section to extension settings
- "Manage Profiles" button → Opens profile management webview
- Shows active profile
- Quick actions: Create, Edit, Delete, Import, Export

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-1.1: Profile Loading**
- Load all profiles from storage: <100ms
- Resolve active profile: <50ms
- Switch active profile: <200ms (including UI update)

**NFR-1.2: Profile Storage**
- Save profile: <500ms
- Delete profile: <300ms
- Import profile: <1s (including validation)

**NFR-1.3: Memory Usage**
- Profile cache: <5MB for 50 profiles
- Incremental loading for large profile lists (if needed)

### 4.2 Security

**NFR-2.1: Credential Storage**
- Use VS Code Secret Storage API (secure keychain)
- Never store credentials in `settings.json`
- Never log credentials in console/output
- Clear credentials on profile deletion

**NFR-2.2: Export Security**
- Exported profiles MUST NOT include credentials
- Add warning in export dialog: "Credentials will not be exported"
- JSON file includes comment: "CREDENTIALS REQUIRED: Add accessKey and secretKey"

**NFR-2.3: Validation**
- Validate profile schema on import
- Sanitize profile names (no special characters, path traversal)
- Validate URLs (endpoint, cdnDomain)

### 4.3 Usability

**NFR-3.1: Profile Names**
- Must be unique (case-insensitive)
- Suggest names based on provider/bucket
- Examples: "Production Blog", "Staging R2", "Client XYZ - AWS"

**NFR-3.2: Error Messages**
- Provider-specific error messages
- Actionable suggestions (e.g., "Profile 'Production' not found. Create it?")
- Link to documentation in error messages

**NFR-3.3: Quick Pick UX**
- Show provider icon (⛅ R2, 📦 S3, 🗄️ MinIO)
- Show bucket name as description
- Show last used time as detail
- Sort by frecency (most recently used first)

### 4.4 Compatibility

**NFR-4.1: VS Code Version**
- Minimum: 1.105.0 (same as current)
- Use VS Code Secret Storage API (available in 1.53.0+)

**NFR-4.2: Settings Sync**
- Profile metadata syncs via Settings Sync
- Credentials do NOT sync (Secret Storage is local)
- Document in README: "Credentials must be configured per machine"

**NFR-4.3: Multi-Root Workspaces**
- Support folder-specific profiles
- Each folder can have different active profile
- Status bar shows profile for currently active file

---

## 5. User Interface Design

### 5.1 Profile Creation Wizard

**Step 1: Basic Info**
```
┌────────────────────────────────────────┐
│ Create Storage Profile                 │
├────────────────────────────────────────┤
│ Profile Name: [Production Blog      ] │
│ Description:  [Main blog production  ] │
│               [bucket for images     ] │
│                                        │
│ [Next]  [Cancel]                       │
└────────────────────────────────────────┘
```

**Step 2: Provider Selection**
```
┌────────────────────────────────────────┐
│ Select Storage Provider                │
├────────────────────────────────────────┤
│ > ⛅ Cloudflare R2                     │
│   📦 AWS S3                            │
│   🗄️ S3-Compatible (MinIO, Spaces...)  │
│                                        │
│ [Back]  [Next]  [Cancel]               │
└────────────────────────────────────────┘
```

**Step 3: Provider Settings (Dynamic)**

*For Cloudflare R2:*
```
┌────────────────────────────────────────┐
│ Cloudflare R2 Configuration            │
├────────────────────────────────────────┤
│ Account ID: [abc123...              ] │
│ Bucket:     [blog-images            ] │
│ Region:     [auto] (fixed)             │
│                                        │
│ [Back]  [Next]  [Cancel]               │
└────────────────────────────────────────┘
```

*For AWS S3:*
```
┌────────────────────────────────────────┐
│ AWS S3 Configuration                   │
├────────────────────────────────────────┤
│ Region:     [us-east-1         ▼]     │
│ Bucket:     [my-blog-images         ] │
│                                        │
│ [Back]  [Next]  [Cancel]               │
└────────────────────────────────────────┘
```

**Step 4: Credentials**
```
┌────────────────────────────────────────┐
│ Storage Credentials                    │
├────────────────────────────────────────┤
│ Access Key ID:     [**************  ] │
│ Secret Access Key: [**************  ] │
│                                        │
│ ℹ️ Stored securely in VS Code keychain │
│                                        │
│ [Back]  [Next]  [Cancel]               │
└────────────────────────────────────────┘
```

**Step 5: CDN & Upload Settings**
```
┌────────────────────────────────────────┐
│ CDN & Upload Settings                  │
├────────────────────────────────────────┤
│ CDN Domain:   [https://cdn.example.com]│
│ Path Prefix:  [blog                 ] │
│                                        │
│ Advanced Settings (Optional):          │
│ ☑ Override max width    [1280      ] │
│ ☐ Override parallel     [5         ] │
│                                        │
│ [Back]  [Create Profile]  [Cancel]     │
└────────────────────────────────────────┘
```

**Step 6: Confirmation**
```
┌────────────────────────────────────────┐
│ Profile Created Successfully! ✅        │
├────────────────────────────────────────┤
│ Name:      Production Blog             │
│ Provider:  Cloudflare R2               │
│ Bucket:    blog-images                 │
│ CDN:       https://cdn.example.com     │
│                                        │
│ ☑ Set as active profile                │
│ ☐ Set as default for this workspace    │
│                                        │
│ [Done]  [Edit Profile]                 │
└────────────────────────────────────────┘
```

### 5.2 Profile Quick Pick (Selection)

```
┌────────────────────────────────────────────────────────┐
│ Select Storage Profile                              ▼  │
├────────────────────────────────────────────────────────┤
│ ⭐ Production Blog                                      │
│    ⛅ Cloudflare R2 • blog-images                      │
│    Last used: 5 minutes ago                            │
├────────────────────────────────────────────────────────┤
│   Staging Environment                                  │
│    ⛅ Cloudflare R2 • blog-staging                     │
│    Last used: 2 hours ago                              │
├────────────────────────────────────────────────────────┤
│   Client ABC - Production                              │
│    📦 AWS S3 • client-abc-blog                         │
│    Last used: 1 day ago                                │
├────────────────────────────────────────────────────────┤
│   Local MinIO Dev                                      │
│    🗄️ MinIO • development                              │
│    Last used: 3 days ago                               │
├────────────────────────────────────────────────────────┤
│ ➕ Create New Profile                                  │
│ ⚙️ Manage Profiles                                      │
└────────────────────────────────────────────────────────┘
```

### 5.3 Profile Management View (Optional Webview)

**Tree View (Sidebar Panel):**
```
STORAGE PROFILES
├─ 📌 Active Profiles
│  └─ ⭐ Production Blog (⛅ R2)
│
├─ 🗂️ All Profiles (4)
│  ├─ Production Blog (⛅ R2)
│  │  └─ Last used: 5 min ago
│  ├─ Staging Environment (⛅ R2)
│  ├─ Client ABC - Production (📦 S3)
│  └─ Local MinIO Dev (🗄️ MinIO)
│
└─ ⚙️ Actions
   ├─ Create New Profile
   ├─ Import Profile
   └─ Export All Profiles
```

**Context Menu (Right-click on profile):**
```
┌──────────────────────────┐
│ Set as Active            │
│ Set as Workspace Default │
│ Edit Profile             │
│ Duplicate Profile        │
│ Export Profile           │
│ Test Connection          │
│ ────────────────────     │
│ Delete Profile           │
└──────────────────────────┘
```

### 5.4 Status Bar States

```
Normal:     📦 Production Blog
No Profile: 📦 No Profile (click to select)
Loading:    📦 Loading...
Error:      ⚠️ Profile Error (click to fix)
Legacy:     📦 Default (Legacy) (click to migrate)
```

---

## 6. Technical Design

### 6.1 Data Architecture

**Storage Locations:**

1. **Extension Global State** (`context.globalState`)
   - Key: `mdimgup.profiles`
   - Value: `StorageProfile[]` (without credentials)
   - Syncs via Settings Sync

2. **Secret Storage** (`context.secrets`)
   - Key: `mdimgup.profile.${profileId}.credentials`
   - Value: JSON string `{ accessKey, secretKey }`
   - Does NOT sync (local only)

3. **Workspace State** (`context.workspaceState`)
   - Key: `mdimgup.workspaceActiveProfile`
   - Value: `string` (profile ID)
   - Workspace-specific

4. **Settings** (User/Workspace `settings.json`)
   - `mdimgup.activeProfile`: Global active profile ID
   - `mdimgup.workspaceProfiles`: Map of workspace → profile ID
   - `mdimgup.folderProfiles`: Map of folder → profile ID

**Migration Path:**
```
Legacy Config → Profiles Migration:
1. Detect legacy config on activation
2. If no profiles exist, show migration prompt
3. Convert legacy config to "Default (Legacy)" profile
4. Store in globalState + secrets
5. Set as active profile
6. Optionally delete legacy settings
```

### 6.2 Profile Manager Service

```typescript
class ProfileManager {
  private profiles: Map<string, StorageProfile>;
  private activeProfileId: string | null;
  
  constructor(
    private context: vscode.ExtensionContext
  ) {}
  
  async initialize(): Promise<void> {
    // Load profiles from globalState
    // Load active profile from settings
    // Migrate legacy config if needed
  }
  
  // Profile CRUD
  async createProfile(profile: Omit<StorageProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageProfile>
  async getProfile(id: string): Promise<StorageProfile | null>
  async updateProfile(id: string, updates: Partial<StorageProfile>): Promise<void>
  async deleteProfile(id: string): Promise<void>
  async listProfiles(): Promise<StorageProfile[]>
  
  // Profile Selection
  async setActiveProfile(id: string, scope: 'global' | 'workspace' | 'folder'): Promise<void>
  async getActiveProfile(): Promise<StorageProfile | null>
  resolveProfile(): StorageProfile | null // Respects resolution order
  
  // Credentials Management
  async setCredentials(profileId: string, credentials: { accessKey: string, secretKey: string }): Promise<void>
  async getCredentials(profileId: string): Promise<{ accessKey: string, secretKey: string } | null>
  async deleteCredentials(profileId: string): Promise<void>
  
  // Import/Export
  async exportProfile(id: string, filePath: string): Promise<void>
  async importProfile(filePath: string): Promise<StorageProfile>
  
  // Validation & Testing
  async validateProfile(profile: StorageProfile): Promise<{ valid: boolean, errors: string[] }>
  async testConnection(id: string): Promise<{ success: boolean, message: string }>
  
  // Migration
  async migrateLegacyConfig(): Promise<StorageProfile | null>
}
```

### 6.3 Profile Resolution Algorithm

```typescript
function resolveActiveProfile(
  manager: ProfileManager,
  editor: vscode.TextEditor | undefined
): StorageProfile | null {
  
  // 1. Check for temporary selection (command parameter)
  if (temporaryProfileId) {
    return manager.getProfile(temporaryProfileId);
  }
  
  // 2. Multi-root workspace: folder-specific profile
  if (editor && vscode.workspace.workspaceFolders?.length > 1) {
    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (folder) {
      const folderProfileId = getFolderProfile(folder.uri.fsPath);
      if (folderProfileId) {
        return manager.getProfile(folderProfileId);
      }
    }
  }
  
  // 3. Workspace-specific profile
  if (vscode.workspace.workspaceFolders?.[0]) {
    const workspaceProfileId = getWorkspaceProfile(
      vscode.workspace.workspaceFolders[0].uri.fsPath
    );
    if (workspaceProfileId) {
      return manager.getProfile(workspaceProfileId);
    }
  }
  
  // 4. Global active profile
  const globalProfileId = getGlobalActiveProfile();
  if (globalProfileId) {
    return manager.getProfile(globalProfileId);
  }
  
  // 5. Fallback to legacy single-config
  const legacyProfile = resolveLegacyConfig();
  if (legacyProfile) {
    return legacyProfile;
  }
  
  // 6. No configuration found
  return null;
}
```

### 6.4 Command Implementation Patterns

**Pattern 1: Profile Selection Flow**
```typescript
async function selectProfileCommand() {
  const profiles = await profileManager.listProfiles();
  
  const items: vscode.QuickPickItem[] = profiles.map(p => ({
    label: p.name,
    description: `${getProviderIcon(p.provider)} ${p.bucket}`,
    detail: `Last used: ${formatTimestamp(p.lastUsed)}`,
    profile: p
  }));
  
  items.push(
    { label: "$(add) Create New Profile", action: "create" },
    { label: "$(gear) Manage Profiles", action: "manage" }
  );
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select storage profile"
  });
  
  if (selected?.profile) {
    await profileManager.setActiveProfile(selected.profile.id, 'global');
    await statusBar.update(selected.profile);
  } else if (selected?.action === "create") {
    await createProfileWizard();
  }
}
```

**Pattern 2: Profile Creation Wizard**
```typescript
async function createProfileWizard(): Promise<StorageProfile | null> {
  // Step 1: Name
  const name = await vscode.window.showInputBox({
    prompt: "Profile name",
    validateInput: (value) => {
      if (!value) return "Name is required";
      if (profileManager.hasProfile(value)) return "Name already exists";
      return null;
    }
  });
  if (!name) return null;
  
  // Step 2: Provider
  const provider = await vscode.window.showQuickPick([
    { label: "⛅ Cloudflare R2", value: "cloudflare-r2" },
    { label: "📦 AWS S3", value: "aws-s3" },
    { label: "🗄️ S3-Compatible", value: "s3-compatible" }
  ], { placeHolder: "Select storage provider" });
  if (!provider) return null;
  
  // Step 3-N: Provider-specific settings (dynamic)
  const config = await collectProviderSettings(provider.value);
  if (!config) return null;
  
  // Create profile
  const profile = await profileManager.createProfile({
    name,
    ...config
  });
  
  // Confirmation
  const setActive = await vscode.window.showInformationMessage(
    `Profile "${name}" created successfully!`,
    "Set as Active",
    "Done"
  );
  
  if (setActive === "Set as Active") {
    await profileManager.setActiveProfile(profile.id, 'global');
  }
  
  return profile;
}
```

### 6.5 Migration Strategy

**Phase 1: Data Layer (Week 1)**
- [ ] Implement `StorageProfile` interface
- [ ] Implement `ProfileManager` service
- [ ] Add Secret Storage integration
- [ ] Implement profile CRUD operations
- [ ] Add profile validation logic

**Phase 2: UI Layer (Week 2)**
- [ ] Implement profile creation wizard
- [ ] Implement profile selection Quick Pick
- [ ] Add status bar integration
- [ ] Implement profile management commands
- [ ] Add import/export functionality

**Phase 3: Integration (Week 2)**
- [ ] Modify upload command to use profiles
- [ ] Implement profile resolution algorithm
- [ ] Add workspace-specific profiles
- [ ] Implement legacy config migration
- [ ] Add backward compatibility layer

**Phase 4: Testing & Polish (Week 3)**
- [ ] Write unit tests for ProfileManager
- [ ] Test migration from legacy config
- [ ] Test multi-workspace scenarios
- [ ] Performance testing (50+ profiles)
- [ ] User acceptance testing

**Phase 5: Documentation & Release (Week 3)**
- [ ] Update README.md with profile guide
- [ ] Create migration guide
- [ ] Update `.github/copilot-instructions.md`
- [ ] Update CHANGELOG.md
- [ ] Release v0.2.0

---

## 7. Security & Privacy Considerations

### 7.1 Credential Security

**Threat: Credentials Exposed in Settings**
- Mitigation: Use VS Code Secret Storage API exclusively
- Never store credentials in `settings.json`
- Warn users if credentials detected in settings

**Threat: Credentials Leaked in Exports**
- Mitigation: Strip credentials from exported JSON
- Add clear warning in export dialog
- Add comment in exported JSON: "CREDENTIALS NOT INCLUDED"

**Threat: Credentials Logged**
- Mitigation: Never log credentials to console/output
- Redact credentials in error messages
- Use `[REDACTED]` placeholder in debug logs

### 7.2 Profile Data Security

**Threat: Profile Data Tampering**
- Mitigation: Validate schema on load
- Sanitize user inputs (names, URLs)
- Use UUID v4 for profile IDs (prevent guessing)

**Threat: Cross-Profile Credential Leakage**
- Mitigation: Strict profile ID validation
- Delete credentials on profile deletion
- Test credential isolation

### 7.3 Settings Sync Privacy

**Issue: Credentials Synced Across Devices**
- Impact: Credentials should NOT sync (security risk)
- Solution: Use Secret Storage (local-only by design)
- Documentation: Clearly state that credentials are machine-specific

---

## 8. Testing Requirements

### 8.1 Unit Tests

**Profile Manager:**
- [ ] Create profile with all fields
- [ ] Create profile with minimal fields
- [ ] Update profile (all properties)
- [ ] Delete profile (including credentials)
- [ ] List profiles (empty, one, many)
- [ ] Get profile by ID (exists, not exists)
- [ ] Validate profile (valid, invalid)
- [ ] Set credentials
- [ ] Get credentials
- [ ] Delete credentials

**Profile Resolution:**
- [ ] Resolve global active profile
- [ ] Resolve workspace-specific profile
- [ ] Resolve folder-specific profile (multi-root)
- [ ] Fallback to legacy config
- [ ] No configuration found

**Migration:**
- [ ] Migrate legacy R2 config
- [ ] Migrate legacy generic config
- [ ] Detect existing profiles (skip migration)
- [ ] Handle incomplete legacy config

### 8.2 Integration Tests

**Profile Lifecycle:**
- [ ] Create → Edit → Delete profile
- [ ] Create → Duplicate → Edit duplicate
- [ ] Create → Export → Import → Verify
- [ ] Create → Set active → Upload images → Verify correct bucket

**Multi-Profile Scenarios:**
- [ ] Create 10 profiles → Switch between them → Verify active profile
- [ ] Set workspace profile → Open different workspace → Verify different profile
- [ ] Create folder profile → Switch folders → Verify correct profile

**Credential Management:**
- [ ] Store credentials → Retrieve → Verify
- [ ] Update credentials → Verify updated
- [ ] Delete profile → Verify credentials deleted

### 8.3 UI/UX Tests

**User Flows:**
- [ ] New user: Create first profile → Upload images
- [ ] Existing user: Migrate legacy config → Verify no breakage
- [ ] Power user: Create 5 profiles → Quick switch → Upload to each
- [ ] Multi-workspace user: Set workspace profiles → Verify auto-selection

**Error Handling:**
- [ ] Create profile with missing credentials → Show error
- [ ] Select profile with invalid credentials → Show error + fix action
- [ ] Import profile with invalid schema → Show error + validation details
- [ ] Delete active profile → Prompt to select new active profile

### 8.4 Performance Tests

**Load Tests:**
- [ ] Load 50 profiles in <100ms
- [ ] Switch profiles in <200ms
- [ ] Create profile in <500ms
- [ ] Import 10 profiles in <2s

**Memory Tests:**
- [ ] 50 profiles use <5MB memory
- [ ] Profile cache does not grow unbounded

---

## 9. Documentation Requirements

### 9.1 README.md Updates

**New Sections:**

1. **Multi-Profile Support**
   - Overview of profiles
   - Use cases (dev/prod, multi-client)
   - Quick start guide

2. **Profile Management**
   - Creating profiles
   - Switching profiles
   - Editing/deleting profiles
   - Import/export workflow

3. **Workspace-Specific Profiles**
   - Setting workspace defaults
   - Multi-root workspace support
   - Folder-specific profiles

4. **Migration Guide**
   - From single-config to profiles
   - Step-by-step instructions
   - FAQ

### 9.2 Command Palette Documentation

**Command List:**
```
- Upload Markdown Images to Cloud Storage (existing)
- Upload Images with Profile Selection (new)
- Create Storage Profile
- Edit Storage Profile
- Delete Storage Profile
- Duplicate Storage Profile
- Select Active Profile
- Quick Switch Profile
- List All Profiles
- Import Profile
- Export Profile
- Export All Profiles
- Migrate Legacy Configuration
- Test Profile Connection
```

### 9.3 Settings Documentation

**New Settings:**
```json
{
  "mdimgup.activeProfile": {
    "type": "string",
    "description": "ID of the currently active storage profile"
  },
  "mdimgup.workspaceProfiles": {
    "type": "object",
    "description": "Map of workspace paths to profile IDs"
  },
  "mdimgup.folderProfiles": {
    "type": "object",
    "description": "Map of folder paths to profile IDs (multi-root workspaces)"
  },
  "mdimgup.showProfileInStatusBar": {
    "type": "boolean",
    "default": true,
    "description": "Show active profile name in status bar"
  },
  "mdimgup.promptMigration": {
    "type": "boolean",
    "default": true,
    "description": "Prompt to migrate legacy configuration to profiles"
  }
}
```

### 9.4 Copilot Instructions Update

Add to `.github/copilot-instructions.md`:

```markdown
## Multi-Profile Support (v0.2.0+)

Architecture:
- `ProfileManager` class manages all profile operations
- Profiles stored in `globalState` (metadata) + `secrets` (credentials)
- Profile resolution order: temporary > folder > workspace > global > legacy
- Backward compatible with single-config (legacy mode)

Key files:
- `src/profile-manager.ts` — Profile CRUD and management
- `src/profile-ui.ts` — UI commands and wizards
- `src/profile-storage.ts` — Storage and Secret Storage integration

Profile structure:
- Unique ID (UUID v4)
- User-defined name and description
- Storage configuration (provider-specific)
- Credentials stored separately in Secret Storage
- Metadata (createdAt, updatedAt, lastUsed)

Commands:
- `mdimgup.createProfile` — Multi-step wizard
- `mdimgup.selectProfile` — Quick Pick with frecency sorting
- `mdimgup.uploadImagesWithProfile` — One-off upload to specific profile

Testing:
- Test profile resolution with multiple workspaces
- Test credential isolation between profiles
- Test migration from legacy config
- Test import/export (without credentials)
```

---

## 10. User Experience Scenarios

### 10.1 Scenario 1: First-Time User

**Goal:** Create first profile and upload images

**Steps:**
1. Install extension
2. Open Markdown file
3. Right-click image → "Upload Markdown Images to Cloud Storage"
4. Extension detects no profile → Shows Quick Pick
5. User clicks "➕ Create New Profile"
6. Wizard opens:
   - Enter name: "My Blog"
   - Select provider: Cloudflare R2
   - Enter R2 account ID, bucket, credentials
   - Enter CDN domain
7. Profile created and set as active
8. Images upload successfully
9. Status bar shows "📦 My Blog"

**Success Criteria:**
- User completes setup in <5 minutes
- Clear guidance at each step
- No confusion about what to enter

### 10.2 Scenario 2: Existing User (Migration)

**Goal:** Migrate from legacy config to profiles

**Steps:**
1. User upgrades extension
2. Extension detects legacy config + no profiles
3. Shows info message: "Convert your current configuration to a named profile?"
4. User clicks "Create Profile"
5. Wizard opens pre-filled with legacy values
6. User enters profile name: "Default (Legacy)"
7. Profile created from legacy config
8. Extension shows: "Migration complete! Your settings are now in 'Default (Legacy)' profile."
9. Legacy settings remain (for rollback safety)
10. User continues working with zero disruption

**Success Criteria:**
- Zero downtime
- No data loss
- Rollback possible (legacy settings preserved)

### 10.3 Scenario 3: Power User (Multi-Environment)

**Goal:** Use different profiles for dev/staging/production

**Steps:**
1. User has 3 profiles:
   - "Dev - MinIO Local"
   - "Staging - R2"
   - "Production - AWS S3"
2. Working on development → Status bar shows "📦 Dev - MinIO Local"
3. Uploads test images → Go to MinIO bucket
4. Ready to deploy → Clicks status bar
5. Quick Pick opens → Selects "Staging - R2"
6. Uploads images again → Go to R2 bucket
7. After testing → Selects "Production - AWS S3"
8. Final upload → Go to AWS S3 bucket
9. All with 2 clicks per switch

**Success Criteria:**
- Profile switch in <5 seconds
- No configuration editing needed
- Clear visual feedback of active profile

### 10.4 Scenario 4: Freelancer (Multi-Client)

**Goal:** Manage profiles for 5 different clients

**Steps:**
1. User has 5 client workspaces:
   - `/projects/client-a` → Profile: "Client A - AWS S3"
   - `/projects/client-b` → Profile: "Client B - R2"
   - `/projects/client-c` → Profile: "Client C - Spaces"
   - (etc.)
2. Opens `client-a` workspace → Extension auto-selects "Client A - AWS S3"
3. Uploads images → Go to Client A bucket
4. Switches to `client-b` workspace → Extension auto-selects "Client B - R2"
5. Uploads images → Go to Client B bucket
6. No manual profile selection needed

**Success Criteria:**
- Workspace-specific profiles work automatically
- No cross-client uploads (error prevention)
- Profile auto-selection is reliable

### 10.5 Scenario 5: Team Collaboration

**Goal:** Share profile template with team (without credentials)

**Steps:**
1. Team lead creates profile "Company Blog - Production"
2. Right-clicks profile → "Export Profile"
3. Saves as `blog-profile.json`
4. Commits to team repo (credentials excluded)
5. Team member clones repo
6. Opens VS Code → "Import Profile"
7. Selects `blog-profile.json`
8. Extension prompts for credentials
9. Team member enters their own credentials
10. Profile imported and ready to use

**Success Criteria:**
- Export excludes credentials (security)
- Import prompts for credentials (usability)
- Team can standardize configurations

---

## 11. Open Questions

### 11.1 Design Decisions

1. **Default Profile on Creation**
   - Q: Should newly created profiles automatically become active?
   - Options:
     - A: Yes, always
     - B: Yes, with confirmation prompt
     - C: No, user must explicitly activate
   - **Recommendation:** B (prompt with checkbox "Set as active profile")

2. **Profile Limit**
   - Q: Should we enforce a hard limit on number of profiles?
   - Options:
     - A: No limit (trust user)
     - B: Soft limit (warn at 25, prevent at 50)
     - C: Hard limit (prevent at 25)
   - **Recommendation:** B (most users need <10, power users may need more)

3. **Legacy Config Cleanup**
   - Q: Should we delete legacy settings after migration?
   - Options:
     - A: Yes, automatically (cleaner)
     - B: Yes, with confirmation (safer)
     - C: No, keep forever (backward compat)
   - **Recommendation:** B (offer "Delete legacy settings?" after successful migration)

4. **Profile Export Format**
   - Q: Should exported profiles include optional settings?
   - Options:
     - A: Include all fields (verbose)
     - B: Include only non-default fields (compact)
     - C: User choice (flexible)
   - **Recommendation:** A (clarity over brevity, easier to edit manually)

5. **Workspace vs. Folder Profiles**
   - Q: Should folder profiles override workspace profiles in multi-root workspaces?
   - Options:
     - A: Yes (more specific wins)
     - B: No (workspace-level only)
   - **Recommendation:** A (matches VS Code settings precedence)

### 11.2 Technical Questions

1. **Profile ID Format**
   - Q: UUID v4 or human-readable slugs?
   - **Recommendation:** UUID v4 (prevents collisions, no sanitization needed)

2. **Credential Storage Key Pattern**
   - Q: `mdimgup.profile.${id}.credentials` or `mdimgup.credentials.${id}`?
   - **Recommendation:** `mdimgup.profile.${id}.credentials` (namespaced under profile)

3. **Profile Sorting**
   - Q: Default sort order for profile lists?
   - Options:
     - A: Alphabetical (predictable)
     - B: Frecency (most recent first)
     - C: Custom order (user-defined)
   - **Recommendation:** B (frecency, with option for custom order in settings)

4. **Status Bar Priority**
   - Q: What priority for status bar item?
   - **Recommendation:** `-1` (right side, before language mode)

5. **Settings Sync Behavior**
   - Q: Should `activeProfile` setting sync?
   - Options:
     - A: Yes (consistent across devices)
     - B: No (machine-specific)
   - **Recommendation:** A (yes, but credentials don't sync — user must configure per machine)

---

## 12. Success Metrics

### 12.1 Adoption Metrics

- **Week 1:**
  - 30% of active users create at least one profile
  - 10% of active users create 2+ profiles

- **Month 1:**
  - 60% of active users migrate to profiles
  - 20% of active users use workspace-specific profiles

- **Quarter 1:**
  - 80% of active users primarily use profiles
  - 5% of active users use legacy config exclusively

### 12.2 Usage Metrics

- **Profile Operations (Per User Per Week):**
  - Profile creations: 0.5 average
  - Profile switches: 5 average
  - Profile edits: 0.2 average

- **Error Rates:**
  - Profile creation errors: <5%
  - Profile resolution errors: <1%
  - Credential errors: <2%

### 12.3 Performance Metrics

- **Latency (P95):**
  - Profile list load: <150ms
  - Profile switch: <250ms
  - Profile creation: <600ms

- **Memory Usage:**
  - Extension base: <10MB
  - +50 profiles: <15MB

### 12.4 User Satisfaction

- **Support Tickets:**
  - Profile-related issues: <10% of total tickets
  - Migration issues: <5% of total tickets

- **User Feedback:**
  - Positive sentiment: >85%
  - Feature request: Profile sync (expected, out of scope)

---

## 13. Risk Assessment

### 13.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Profile corruption | High | Low | Schema validation, backup before save |
| Credential loss | High | Low | Secret Storage is reliable, test extensively |
| Migration failure | High | Medium | Keep legacy config as fallback, test all scenarios |
| Performance degradation (50+ profiles) | Medium | Low | Lazy loading, profile cache |
| Settings Sync conflict | Medium | Medium | Document clearly, test sync behavior |

### 13.2 User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Confusion between profiles and legacy config | Medium | High | Clear migration prompt, hide legacy after migration |
| Difficulty setting up first profile | Medium | Medium | Wizard with validation, clear error messages |
| Accidental profile deletion | High | Low | Confirmation dialog, offer undo |
| Upload to wrong profile | High | Medium | Show profile name in all notifications, status bar |
| Credential confusion (which key?) | Medium | Medium | Provider-specific field labels, examples |

### 13.3 Maintenance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Increased code complexity | Medium | High | Modular design, comprehensive tests |
| More support burden | Medium | Medium | Excellent documentation, inline help |
| Breaking changes in VS Code API | Medium | Low | Use stable APIs, monitor VS Code releases |

---

## 14. Future Enhancements (Out of Scope)

### 14.1 Profile Management UI (Webview)

- Rich UI for profile CRUD
- Drag-and-drop profile ordering
- Visual profile testing (upload test image)
- Batch operations (bulk edit, bulk delete)

### 14.2 Advanced Profile Features

- **Profile Groups:** Organize profiles into folders (e.g., "Production", "Development")
- **Profile Tags:** Filter profiles by tags (e.g., "client-a", "urgent")
- **Profile Search:** Fuzzy search by name, bucket, provider
- **Profile Templates:** Pre-configured templates for common providers
- **Profile Sharing:** Share profiles via URL (credentials excluded)

### 14.3 Smart Profile Selection

- **Auto-Detection:** Detect provider from CDN domain in Markdown
- **ML-Based Suggestion:** Suggest profile based on file path, git branch, time of day
- **Git Branch Integration:** Auto-select profile based on git branch (dev → dev profile)

### 14.4 Enterprise Features

- **Centralized Profile Management:** Admin-managed profiles via settings JSON
- **Profile Policies:** Enforce profile usage (e.g., require production approval)
- **Audit Logging:** Track profile usage, upload history
- **SSO Integration:** Use VS Code authentication for credentials

### 14.5 Cloud Storage Expansion

- **Azure Blob Storage:** Native support (not S3-compatible)
- **Google Cloud Storage:** Native support (not S3-compatible)
- **Alibaba Cloud OSS:** Native support
- **SFTP/FTP:** Upload to traditional servers

---

## 15. Approval & Next Steps

### 15.1 Stakeholders

- [ ] **Extension Maintainer** (leonwong282) — Final approval
- [ ] **Early Adopter Users** — Beta testing feedback
- [ ] **Technical Reviewer** — Architecture review

### 15.2 Review Checklist

- [ ] Requirements are clear and actionable
- [ ] Backward compatibility is maintained
- [ ] Security considerations are addressed
- [ ] Performance impact is acceptable
- [ ] User experience is intuitive
- [ ] Testing strategy is comprehensive
- [ ] Documentation plan is complete
- [ ] Implementation timeline is realistic

### 15.3 Next Steps

1. **Review & Feedback (1 week)**
   - Share this document with stakeholders
   - Collect feedback and questions
   - Clarify open questions (Section 11)

2. **Approval (3 days)**
   - Stakeholder sign-off
   - Finalize design decisions
   - Lock requirements

3. **Implementation (3 weeks)**
   - Follow implementation plan (Section 6.5)
   - Weekly progress updates
   - Iterative testing

4. **Beta Testing (1 week)**
   - Release pre-release version
   - Gather user feedback
   - Fix critical issues

5. **Release (1 day)**
   - Finalize documentation
   - Publish to marketplace
   - Announce features

---

## 16. Appendix

### 16.1 Profile JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Storage Profile",
  "type": "object",
  "required": ["id", "name", "provider", "bucket", "cdnDomain"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
      "description": "UUID v4"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "provider": {
      "type": "string",
      "enum": ["cloudflare-r2", "aws-s3", "s3-compatible"]
    },
    "endpoint": {
      "type": "string",
      "format": "uri"
    },
    "region": {
      "type": "string"
    },
    "bucket": {
      "type": "string",
      "minLength": 1
    },
    "accountId": {
      "type": "string"
    },
    "cdnDomain": {
      "type": "string",
      "format": "uri"
    },
    "pathPrefix": {
      "type": "string",
      "default": "blog"
    },
    "maxWidth": {
      "type": "number",
      "minimum": 100,
      "maximum": 10000
    },
    "parallelUploads": {
      "type": "number",
      "minimum": 1,
      "maximum": 20
    },
    "useCache": {
      "type": "boolean"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "lastUsed": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### 16.2 Exported Profile Example

```json
{
  "version": "1.0",
  "exportedAt": "2025-11-19T10:30:00Z",
  "exportedBy": "mdimgup v0.2.0",
  "profiles": [
    {
      "name": "Production Blog",
      "description": "Main blog production bucket",
      "provider": "cloudflare-r2",
      "region": "auto",
      "bucket": "blog-images",
      "accountId": "abc123...",
      "cdnDomain": "https://cdn.example.com",
      "pathPrefix": "blog",
      "maxWidth": 1280,
      "parallelUploads": 5,
      "useCache": true,
      
      "_credentials": "REQUIRED: Add accessKey and secretKey when importing"
    }
  ],
  "_notice": "Credentials are NOT included in this export for security. You must configure them after importing."
}
```

### 16.3 Command Palette Examples

```
> Markdown Image Upload: Upload Images to Cloud Storage
> Markdown Image Upload: Upload with Profile Selection
> Markdown Image Upload: Create Profile
> Markdown Image Upload: Edit Profile
> Markdown Image Upload: Delete Profile
> Markdown Image Upload: Select Active Profile
> Markdown Image Upload: Quick Switch Profile (Ctrl+Alt+P)
> Markdown Image Upload: List All Profiles
> Markdown Image Upload: Import Profile
> Markdown Image Upload: Export Profile
> Markdown Image Upload: Export All Profiles
> Markdown Image Upload: Test Profile Connection
> Markdown Image Upload: Migrate Legacy Configuration
```

---

**END OF REQUIREMENTS DOCUMENT**

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-19 | AI Assistant | Initial draft |

---

**Document Status:** 📝 Draft — Awaiting Stakeholder Review
