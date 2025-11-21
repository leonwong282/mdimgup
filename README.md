<a id="readme-top"></a>

<div align="center">

<a href="https://github.com/leonwong282/awesome-project-template">
  <img src="images/logo.png" alt="Logo" width="80" height="80">
</a>

# 📦 mdimgup

> Markdown Image Upload for VS Code - Upload to Any S3-Compatible Cloud Storage

![Version](https://img.shields.io/badge/Version-0.2.1-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![VS Code](https://img.shields.io/badge/VS%20Code-1.105.0+-purple?style=for-the-badge)

[Features](#-features) • [Quick Start](#-quick-start) • [Multi-Profile](#-multi-profile-support) • [Providers](#-supported-providers) • [Migration](#-migration-guide)

</div>

---

## 📸 Overview

`mdimgup` is a powerful VS Code extension that automatically uploads local images referenced in your Markdown files to S3-compatible cloud storage (Cloudflare R2, AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, etc.), then updates the image links in-place.

**✨ NEW in v0.2.1:** Multi-profile support, custom naming patterns, and upload history with undo! Manage multiple storage configurations, control filename formats, and revert uploads with one click.

## ✨ Features

- 🎯 **Multi-Profile Management**: Save and switch between multiple storage configurations
- ☁️ **Universal S3 Support**: Works with Cloudflare R2, AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, and any S3-compatible service
- 🎨 **Custom Naming Patterns**: User-defined filename templates with variables (timestamp, date, hash, profile, counter, etc.)
- 📜 **Upload History & Undo**: Track uploaded images and revert with one command (optionally delete from S3)
- 🖼️ **Smart Image Processing**: Automatic resizing (except GIFs) before upload
- ⚡ **Fast Parallel Uploads**: Configurable concurrency for quick batch uploads
- 🔐 **Secure Credentials**: Stored in VS Code's secure keychain (Secret Storage)
- 📊 **Status Bar Integration**: Always see your active profile at a glance
- 🎨 **Workspace-Aware**: Auto-select profiles based on workspace
- 💾 **Session Cache**: Avoid duplicate uploads in the same session
- 🔄 **Import/Export**: Share profile templates with your team
- ⌨️ **Quick Switch**: Change profiles with `Ctrl+Alt+P` / `Cmd+Alt+P`

## 🛠️ Tech Stack

- **Storage**: S3-compatible API (AWS SDK v3)
- **Image Processing**: Sharp (resize, optimize)
- **Security**: VS Code Secret Storage API (secure keychain)
- **Caching**: In-memory MD5-based deduplication
- **UI**: VS Code Quick Pick, Status Bar, Command Palette

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **VS Code** (v1.105.0 or higher)
- **S3-compatible storage account** (see [Supported Providers](#-supported-providers))
- **Bucket credentials**: Access Key ID and Secret Access Key
- **CDN domain**: Public URL for your bucket (or bucket URL)

### Installation

1. **Install from VS Code Marketplace**
   ```
   ext install mdimgup
   ```
   Or search for "mdimgup" in the Extensions view (`Ctrl+Shift+X`)

2. **Create Your First Profile**
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run: `Create Storage Profile`
   - Follow the wizard to configure your storage

3. **Start Uploading**
   - Open a Markdown file
   - Right-click → **Upload Markdown Images to Cloud Storage**
   - Watch your local images transform into CDN URLs!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🎯 Multi-Profile Support

**NEW in v0.2.0!** Manage multiple storage configurations effortlessly.

### Why Multi-Profile?

- 🏢 **Separate environments**: Development, staging, and production buckets
- 👥 **Multiple clients**: Freelancers managing different client projects
- 🌐 **Multiple blogs**: Each blog/project uses different storage
- 🔬 **Testing**: Local MinIO for dev, cloud storage for production

### Quick Profile Management

#### Create a Profile
```
Ctrl+Shift+P → "Create Storage Profile"
```
- Interactive wizard guides you through setup
- Credentials stored securely in VS Code keychain
- Profile-specific settings (max width, parallelism, etc.)

#### Switch Profiles
```
   - Run: `Mdimgup: Create Storage Profile`
Cmd+Alt+P   (macOS)
```
Or click the profile name in the status bar.

#### Workspace-Specific Profiles
Set a default profile for each workspace:

Ctrl+Shift+P → "Select Active Profile" → Check "Set as workspace default"
 Interactive wizard guides you through setup
 Credentials stored securely in VS Code keychain
 Profile-specific settings (max width, parallelism, etc.)

| Command | Description |
|---------|-------------|
| **Create Storage Profile** | Launch profile creation wizard |
| **Select Active Profile** | Choose active profile |
| **Quick Switch Profile** | Fast profile switcher (`Ctrl+Alt+P`) |
| **Upload with Profile Selection** | One-off upload to specific profile |
| **Edit Storage Profile** | Modify existing profiles |
| **Delete Storage Profile** | Remove profiles |
| **Duplicate Storage Profile** | Copy profile (without credentials) |
| **List All Profiles** | View all configured profiles |
| **Import Profile** | Import from JSON file |
| **Export Profile** | Export to JSON file (credentials excluded) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ☁️ Supported Providers

- ✅ **Cloudflare R2** - Zero egress fees, great for blogs
- ✅ **AWS S3** - Industry-standard object storage
- ✅ **MinIO** - Self-hosted, open-source alternative
- ✅ **DigitalOcean Spaces** - Simple with built-in CDN
- ✅ **Backblaze B2** - Affordable, S3-compatible
- ✅ **Any S3-compatible service** - Generic mode available

 2. Run: **Mdimgup: Create Storage Profile**

### Option 1: Using Profiles (Recommended)

**Recommended:** Use the profile creation wizard for the easiest setup.

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Run: **Create Storage Profile**
3. Follow the wizard:
   - Enter profile name (e.g., "Production Blog")
   - Select storage provider
   - Enter provider-specific settings
   - Enter credentials (stored securely)
   - Set CDN domain and path prefix

### Option 2: Legacy Single-Config (Still Supported)

For backward compatibility, you can still use global settings:

<details>
<summary><strong>Cloudflare R2</strong> (Recommended for blogs)</summary>

**Profile Setup (Wizard):**
1. Provider: Select "Cloudflare R2"
2. Account ID: Your R2 account ID (e.g., `abc123...`)
3. Bucket: Your bucket name (e.g., `blog-images`)
4. Credentials: Access Key ID and Secret Access Key
5. CDN Domain: Your custom domain (e.g., `https://cdn.example.com`)
6. Path Prefix: Folder for uploads (e.g., `blog`, `images`, or empty for root)

**Or Manual Settings (settings.json):**
```json
{
  "mdimgup.storageProvider": "cloudflare-r2",
  "mdimgup.accountId": "your_account_id",
  "mdimgup.bucket": "my-blog-images",
  "mdimgup.accessKey": "your_access_key",
  "mdimgup.secretKey": "your_secret_key",
  "mdimgup.cdnDomain": "https://cdn.example.com",
  "mdimgup.pathPrefix": "blog"
}
```

**How to get credentials:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create a bucket
3. Navigate to R2 → Overview → Manage R2 API Tokens
4. Create API token with "Object Read & Write" permissions
5. Set up custom domain: Bucket Settings → Public Access → Custom Domains

</details>

<details>
<summary><strong>AWS S3</strong></summary>

**Profile Setup (Wizard):**
1. Provider: Select "AWS S3"
2. Region: AWS region (e.g., `us-east-1`, `eu-west-1`, `ap-northeast-1`)
3. Bucket: Your bucket name (e.g., `my-blog-images`)
4. Credentials: IAM Access Key ID and Secret Access Key
5. CDN Domain: S3 URL or CloudFront domain (e.g., `https://my-blog-images.s3.amazonaws.com` or `https://d1234.cloudfront.net`)
6. Path Prefix: Folder for uploads (e.g., `images`, `blog`)

**Or Manual Settings (settings.json):**
```json
{
  "mdimgup.storageProvider": "aws-s3",
  "mdimgup.region": "us-east-1",
  "mdimgup.bucket": "my-blog-images",
  "mdimgup.accessKey": "AKIAIOSFODNN7EXAMPLE",
  "mdimgup.secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "mdimgup.cdnDomain": "https://my-blog-images.s3.amazonaws.com",
  "mdimgup.pathPrefix": "images"
}
```

**How to get credentials:**
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create IAM user: Users → Add Users → Attach policies → `AmazonS3FullAccess` (or custom policy)
3. Create access keys: User → Security Credentials → Create Access Key
4. Create S3 bucket: [S3 Console](https://s3.console.aws.amazon.com/) → Create Bucket
5. Configure public access: Bucket → Permissions → Block Public Access (disable) → Bucket Policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::my-blog-images/*"
     }]
   }
   ```
6. Optional: Set up CloudFront for better CDN performance

</details>

<details>
<summary><strong>MinIO</strong> (Self-hosted)</summary>

**Profile Setup (Wizard):**
1. Provider: Select "S3-Compatible (MinIO, Spaces, etc.)"
2. Endpoint: Your MinIO URL (e.g., `https://minio.example.com` or `http://localhost:9000`)
3. Region: Any value (e.g., `us-east-1` - MinIO ignores this)
4. Bucket: Your bucket name (e.g., `blog`, `images`)
5. Credentials: MinIO access key and secret key
6. CDN Domain: Same as endpoint + bucket (e.g., `https://minio.example.com/blog`)
7. Path Prefix: Folder for uploads (or empty for bucket root)

**Or Manual Settings (settings.json):**
```json
{
  "mdimgup.storageProvider": "s3-compatible",
  "mdimgup.endpoint": "https://minio.example.com",
  "mdimgup.bucket": "blog",
  "mdimgup.accessKey": "minioadmin",
  "mdimgup.secretKey": "minioadmin",
  "mdimgup.cdnDomain": "https://minio.example.com/blog",
  "mdimgup.pathPrefix": ""
}
```

**How to set up:**
1. Install MinIO:
   ```bash
   # Docker
   docker run -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /data --console-address ":9001"
   ```
2. Access MinIO Console: http://localhost:9001
3. Create bucket: Buckets → Create Bucket
4. Create access keys: Identity → Service Accounts → Create Service Account
5. Set bucket policy to public (if needed): Bucket → Access Policy → Public

</details>

<details>
<invoke name="DigitalOcean Spaces</strong></summary>

**Profile Setup (Wizard):**
1. Provider: Select "S3-Compatible (MinIO, Spaces, etc.)"
2. Endpoint: Regional endpoint (e.g., `https://nyc3.digitaloceanspaces.com`, `https://sfo3.digitaloceanspaces.com`)
3. Region: Match endpoint region (e.g., `nyc3`, `sfo3`, `ams3`)
4. Bucket: Your Space name (e.g., `my-space`)
5. Credentials: Spaces Access Key and Secret Key
6. CDN Domain: Your Space CDN URL (e.g., `https://my-space.nyc3.cdn.digitaloceanspaces.com`)
7. Path Prefix: Folder for uploads (e.g., `blog`, `images`)

**Or Manual Settings (settings.json):**
```json
{
  "mdimgup.storageProvider": "s3-compatible",
  "mdimgup.endpoint": "https://nyc3.digitaloceanspaces.com",
  "mdimgup.region": "nyc3",
  "mdimgup.bucket": "my-space",
  "mdimgup.accessKey": "DO00EXAMPLE",
  "mdimgup.secretKey": "your_secret_key",
  "mdimgup.cdnDomain": "https://my-space.nyc3.cdn.digitaloceanspaces.com",
  "mdimgup.pathPrefix": "blog"
}
```

**How to get credentials:**
1. Go to [DigitalOcean Cloud](https://cloud.digitalocean.com/spaces)
2. Create a Space: Spaces → Create Space → Choose region → Enter name
3. Enable CDN: Space Settings → Enable CDN (recommended for better performance)
4. Generate API keys: API → Spaces Keys → Generate New Key
5. Configure CORS (if accessing from web): Space Settings → CORS → Add:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET"],
     "AllowedHeaders": ["*"]
   }
   ```

</details>

<details>
<summary><strong>Backblaze B2</strong></summary>

**Profile Setup (Wizard):**
1. Provider: Select "S3-Compatible (MinIO, Spaces, etc.)"
2. Endpoint: Regional S3 endpoint (e.g., `https://s3.us-west-001.backblazeb2.com`, `https://s3.eu-central-003.backblazeb2.com`)
3. Region: Match endpoint (e.g., `us-west-001`, `eu-central-003`)
4. Bucket: Your B2 bucket name (e.g., `my-bucket`)
5. Credentials: Application Key ID and Application Key
6. CDN Domain: B2 friendly URL or custom domain (e.g., `https://f001.backblazeb2.com/file/my-bucket` or `https://cdn.example.com`)
7. Path Prefix: Folder for uploads (e.g., `blog`, `images`)

**Or Manual Settings (settings.json):**
```json
{
  "mdimgup.storageProvider": "s3-compatible",
  "mdimgup.endpoint": "https://s3.us-west-001.backblazeb2.com",
  "mdimgup.bucket": "my-bucket",
  "mdimgup.accessKey": "your_key_id",
  "mdimgup.secretKey": "your_application_key",
  "mdimgup.cdnDomain": "https://f001.backblazeb2.com/file/my-bucket",
  "mdimgup.pathPrefix": "blog"
}
```

**How to get credentials:**
1. Go to [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Create bucket: B2 Cloud Storage → Buckets → Create a Bucket → Set to "Public"
3. Create application key: App Keys → Add a New Application Key → Select bucket → Generate
4. Find S3 endpoint: Bucket Details → Endpoint (in the format `s3.region.backblazeb2.com`)
5. Get friendly URL: Bucket Details → Friendly URL (or set up custom domain via Cloudflare/etc.)

</details>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔄 Migration Guide

### Upgrading from v0.1.0 to v0.2.0

**Good news!** Your existing configuration continues to work. No immediate action required.

#### Migration from v0.1.0 to v0.2.1

**Good news!** Your v0.1.0 configuration continues to work. No immediate action required.

**Automatic Migration**

On first use of v0.2.1, the extension will:
1. Detect your existing v0.1.0 configuration (generic settings)
2. Offer to convert it to a named profile
3. Keep your legacy settings as fallback (for safety)

**Manual Migration (Recommended)**

**Step 1: Your Current Settings Work**
```json
// Your v0.1.0 settings.json (still supported)
{
  "mdimgup.storageProvider": "cloudflare-r2",
  "mdimgup.accountId": "abc123",
  "mdimgup.bucket": "my-blog",
  "mdimgup.accessKey": "...",
  "mdimgup.secretKey": "...",
  "mdimgup.cdnDomain": "https://cdn.example.com"
}
```

**Step 2: Create Profile (Optional but Recommended)**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `Mdimgup: Create Storage Profile`
3. Use the wizard (settings will be pre-filled if possible)

**Step 3: Clean Up (Optional)**
After confirming profiles work:
1. Open settings.json
2. Remove old settings
3. Keep only profile-related settings:
   ```json
   {
     "mdimgup.activeProfile": "uuid-of-profile",
     "mdimgup.showProfileInStatusBar": true
   }
   ```

#### ⚠️ Breaking Change: v0.0.1 R2-Only Settings Removed

If you're still using the **original v0.0.1 R2-only settings**, these are **no longer supported**:

```json
// ❌ REMOVED in v0.2.1 (v0.0.1 settings)
{
  "mdimgup.r2AccountId": "...",
  "mdimgup.r2Bucket": "...",
  "mdimgup.r2AccessKey": "...",
  "mdimgup.r2SecretKey": "...",
  "mdimgup.r2Domain": "..."
}
```

**Migration Path:** Create a new profile with your R2 credentials using `Mdimgup: Create Storage Profile`.
### Multi-Profile Examples

#### Scenario 1: Development vs. Production
```
Profile: "Dev - MinIO Local"
├─ Provider: S3-Compatible
├─ Endpoint: http://localhost:9000
└─ Bucket: dev-images

Profile: "Production - R2"
├─ Provider: Cloudflare R2
├─ Account: abc123
└─ Bucket: prod-images
```

#### Scenario 2: Multi-Client Freelancer
```
Profile: "Client A - AWS S3"
Workspace: /projects/client-a → Auto-select this profile

Profile: "Client B - Cloudflare R2"  
Workspace: /projects/client-b → Auto-select this profile

Profile: "Client C - DigitalOcean"
Workspace: /projects/client-c → Auto-select this profile
```

#### Scenario 3: Multiple Blogs
```
Profile: "Tech Blog - R2"
├─ Workspace: ~/blogs/tech-blog
└─ CDN: https://tech.cdn.example.com

Profile: "Personal Blog - S3"
├─ Workspace: ~/blogs/personal
└─ CDN: https://personal-blog.s3.amazonaws.com
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ⚙️ Configuration Reference

### Profile Settings

Profiles store all configuration and credentials. Access via:
- Profile creation wizard (recommended)
- Or manually in `globalState` (advanced)

### Global Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mdimgup.activeProfile` | string | `""` | ID of currently active profile |
| `mdimgup.showProfileInStatusBar` | boolean | `true` | Show profile name in status bar |
| `mdimgup.promptMigration` | boolean | `true` | Prompt to migrate legacy config |
| `mdimgup.maxWidth` | number | `1280` | Default max image width (overridable per profile) |
| `mdimgup.parallelUploads` | number | `5` | Default concurrent uploads (overridable per profile) |
| `mdimgup.useCache` | boolean | `true` | Default cache behavior (overridable per profile) |

### Legacy Settings (v0.1.0 - Still Supported)

These settings are automatically migrated to profiles on first use:

| Setting | Type | Description |
|---------|------|-------------|
| `mdimgup.storageProvider` | string | Provider type (set when creating profile) |
| `mdimgup.bucket` | string | Bucket name (set when creating profile) |
| `mdimgup.accessKey` | string | Access key (stored securely in profile credentials) |
| `mdimgup.secretKey` | string | Secret key (stored securely in profile credentials) |
| `mdimgup.accountId` | string | Account ID for R2 (set when creating profile) |
| `mdimgup.endpoint` | string | Custom endpoint for S3-compatible (set when creating profile) |
| `mdimgup.region` | string | AWS region (set when creating profile) |
| `mdimgup.cdnDomain` | string | CDN domain (set when creating profile) |
| `mdimgup.pathPrefix` | string | Upload path prefix (set when creating profile) |

**Note:** v0.0.1 R2-specific settings (`r2AccountId`, `r2Bucket`, `r2AccessKey`, `r2SecretKey`, `r2Domain`) are **removed** and no longer supported.



<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📝 Usage

### Basic Workflow

1. **Open a Markdown file** containing local images:
   ```markdown
   ![Screenshot](./images/screenshot.png)
   ![Diagram](../assets/diagram.jpg)
   ```

2. **Upload images**:
   - **Method 1**: Right-click → **Upload Markdown Images to Cloud Storage**
   - **Method 2**: Command Palette → **Upload Markdown Images to Cloud Storage**
   - **Method 3**: Right-click → **Upload Images with Profile Selection** (choose profile first)

3. **Watch the magic** ✨:
   - Extension resizes images (if needed)
   - Uploads to your active profile's storage
   - Updates links in-place:
     ```markdown
     ![Screenshot](https://cdn.example.com/blog/1700000000000-screenshot.png)
     ![Diagram](https://cdn.example.com/blog/1700000000001-diagram.jpg)
     ```

### Status Bar

The status bar shows your active profile:
- **📦 Production Blog** - Click to switch profiles
- **📦 No Profile** - Click to create or select profile

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+P` / `Cmd+Alt+P` | Quick switch profile |

### 💡 Pro Tip: Using Clipboard Managers for Credentials

When creating or editing profiles, you need to input access keys and secret keys. Since VS Code's command palette closes when you switch windows (to copy credentials), we recommend using a **clipboard manager** to streamline this process:

**Recommended workflow:**
1. **Before** running `Mdimgup: Create Storage Profile` or `Mdimgup: Edit Storage Profile`:
   - Copy your access key and secret key from your provider's dashboard
   - Your clipboard manager (e.g., [Raycast](https://www.raycast.com/), [Alfred](https://www.alfredapp.com/), macOS native clipboard history) will store them
   
2. **During** profile creation:
   - When prompted for credentials, use your clipboard manager shortcut (e.g., `Cmd+Shift+V` in Raycast)
   - Paste the appropriate credential without losing the command palette focus
   
3. **Popular clipboard managers:**
   - **macOS**: Raycast (free), Alfred, Paste, Maccy
   - **Windows**: Ditto, ClipClip, Windows 11 clipboard history (`Win+V`)
   - **Linux**: CopyQ, Clipman, Parcellite

This approach prevents the command palette from closing mid-flow and provides a smoother credential input experience.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🎨 Advanced Features

### Profile-Specific Settings

Override global settings per profile:

```
Profile: "High-Res Photography"
├─ Max Width: 2560 (override global 1280)
├─ Parallel Uploads: 10 (override global 5)
└─ Use Cache: false

Profile: "Blog Thumbnails"
├─ Max Width: 800
├─ Parallel Uploads: 3
└─ Use Cache: true
```

### Import/Export Profiles

**Export** (share with team):
```
Command Palette → Export Profile → Select profile → Save as JSON
```

**Import** (receive from team):
```
Command Palette → Import Profile → Select JSON file → Add credentials
```

**Note:** Credentials are **never** included in exports for security. Team members must add their own credentials after import.

### Workspace-Specific Profiles

Set different profiles for each workspace:
1. Open workspace
2. Command Palette → **Select Active Profile**
3. Choose profile
4. Check "Set as workspace default"

The extension will automatically use the correct profile when you open that workspace.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔧 Troubleshooting

### Common Issues

<details>
<summary><strong>"No storage profile configured" error</strong></summary>

**Solution:**
1. Create a profile: Command Palette → **Create Storage Profile**
2. Or select existing: Command Palette → **Select Active Profile**
3. Or the extension will prompt you automatically on first upload

</details>

<details>
<summary><strong>"No credentials found for profile" error</strong></summary>

**Solution:**
1. Edit profile: Command Palette → **Edit Storage Profile**
2. Or delete and recreate profile with correct credentials
3. Credentials are stored in VS Code's secure keychain - if you migrated devices, you'll need to re-enter them

</details>

<details>
<summary><strong>Images not uploading</strong></summary>

**Check:**
- ✅ Credentials have write permissions to bucket
- ✅ Bucket exists and is accessible
- ✅ Network connection is stable
- ✅ For R2: Account ID is correct
- ✅ For S3: Region matches bucket region
- ✅ For S3-compatible: Endpoint URL is correct

**Test:**
1. Command Palette → **List All Profiles**
2. Verify profile configuration
3. Try re-creating profile with fresh credentials

</details>

<details>
<summary><strong>CDN URLs not working (404 errors)</strong></summary>

**Check:**
- ✅ `cdnDomain` points to correct URL
- ✅ Bucket has public read access enabled
- ✅ For custom domains: DNS is properly configured
- ✅ For R2: Custom domain is added in R2 dashboard
- ✅ For Spaces: CDN is enabled

**Test in browser:**
```
https://your-cdn-domain.com/path-prefix/filename.jpg
```

</details>

<details>
<summary><strong>Profile not switching</strong></summary>

**Solution:**
1. Check status bar shows correct profile
2. Try: Command Palette → **Select Active Profile** → Choose manually
3. For workspace profiles: Ensure you're in the correct workspace
4. Restart VS Code if issue persists

</details>

<details>
<summary><strong>Migration not working</strong></summary>

**Solution:**
1. Manually create profile from your settings
2. Or run: Command Palette → **Create Storage Profile**
3. Copy values from your `settings.json`
4. After verification, remove old settings

</details>

### Getting Help

If you're stuck:
- 📝 [Open an issue](https://github.com/leonwong282/mdimgup/issues/new)
- 💬 [Start a discussion](https://github.com/leonwong282/mdimgup/discussions)
- 📧 Email: leonwong282@gmail.com

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🎯 Custom Naming Patterns

**NEW in v0.2.0!** Control uploaded filename formats with custom naming patterns.

### Why Naming Patterns?

- 📁 **Organize files**: Date-based folders, structured naming
- 🔍 **SEO-friendly URLs**: Use original filenames instead of timestamps
- 🎨 **Consistency**: Standardize naming across projects
- 🏷️ **Context**: Include profile names, dates, or custom identifiers

### Pattern Variables

Use these variables in your naming pattern:

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{timestamp}` | Unix timestamp (milliseconds) | `1700000000000` |
| `{date}` | Date (YYYY-MM-DD) | `2024-03-15` |
| `{time}` | Time (HH-mm-ss) | `14-30-45` |
| `{datetime}` | Date and time | `2024-03-15_14-30-45` |
| `{filename}` | Original filename (without extension) | `screenshot` |
| `{ext}` | File extension (with dot) | `.png` |
| `{hash:N}` | First N characters of file hash | `{hash:8}` → `a1b2c3d4` |
| `{profile}` | Active profile name (lowercase, spaces→dashes) | `production-blog` |
| `{counter}` | Auto-incrementing counter (resets per session) | `001`, `002`, `003` |
| `{random:N}` | N random alphanumeric characters | `{random:6}` → `x7k9m2` |

### Pattern Examples

**Predefined templates** (available during profile creation/editing):

```
1. {timestamp}-{filename}{ext}
   → 1700000000000-screenshot.png
   Default pattern, ensures uniqueness

2. {date}/{filename}{ext}  
   → 2024-03-15/screenshot.png
   Date-organized folders

3. {profile}/{datetime}-{filename}{ext}
   → my-blog/2024-03-15_14-30-45-screenshot.png
   Profile-specific with timestamp

4. {date}/{hash:8}-{filename}{ext}
   → 2024-03-15/a1b2c3d4-screenshot.png
   Date + content hash

5. {filename}-{random:6}{ext}
   → screenshot-x7k9m2.png
   Keep original name with random suffix

6. images/{counter:03d}-{filename}{ext}
   → images/001-screenshot.png
   Sequential numbering
```

### Setting Naming Patterns

**During Profile Creation:**
1. Command Palette → `Mdimgup: Create Storage Profile`
2. Follow wizard steps
3. At "Naming Pattern" step, choose a template or enter custom pattern
4. Preview shows example output

**Editing Existing Profile:**
1. Command Palette → `Mdimgup: Edit Storage Profile`
2. Select "Edit naming pattern"
3. Choose template or enter custom pattern
4. Preview and confirm

**Pattern Validation:**
The extension validates patterns and shows examples before saving:
- ✅ Valid variables are recognized
- ⚠️ Unknown variables trigger warnings
- 📝 Preview shows actual output format

### Custom Pattern Examples

```
SEO-friendly with dates:
{date}/{filename}{ext}
→ 2024-03-15/my-blog-post-hero-image.png

Content-addressed storage:
{hash:16}{ext}
→ a1b2c3d4e5f6g7h8.png

Project-based organization:
{profile}/{date}/{filename}{ext}
→ client-a/2024-03-15/invoice.pdf

Sequential with timestamp:
{date}/{counter:04d}-{timestamp}{ext}
→ 2024-03-15/0001-1700000000000.png
```

**Pro Tips:**
- Use `{hash:8}` for content deduplication
- Use `{date}/` for time-based organization
- Use `{profile}` for multi-project workflows
- Use `{counter}` for ordered uploads within a session
- Keep `{ext}` at the end to preserve file type

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📜 Upload History & Undo

**NEW in v0.2.0!** Track all uploaded images and undo mistakes with one command.

### Why Upload History?

- ⏪ **Undo uploads**: Accidentally uploaded wrong image? Revert with one click
- 🗑️ **Clean up storage**: Delete uploaded files from S3 during undo
- 📊 **Track usage**: See all uploaded images, when, and to which profile
- 🔍 **Find images**: Browse upload history by document, profile, or date

### Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **View Upload History** | - | Browse recent uploads with actions |
| **Undo Last Upload** | - | Revert last upload in current document |
| **Clear Upload History** | - | Delete history records (keeps S3 files) |

### View Upload History

**Access:** Command Palette → `Mdimgup: View Upload History`

**Features:**
- 📋 Shows last 100 uploads
- 🔎 Filter by current document
- ⚡ Quick actions: Undo, Open, Copy URL, Delete, Details

**Display format:**
```
🖼️ screenshot.png → https://cdn.example.com/blog/1700000000000-screenshot.png
   Profile: Production Blog | Size: 245 KB | 2 hours ago
```

**Actions per record:**
- **Undo Upload**: Revert link in document + optionally delete from S3
- **Open Document**: Jump to the document containing the image
- **Copy URL**: Copy CDN URL to clipboard
- **Delete Record**: Remove from history (keeps S3 file)
- **Show Details**: View full upload metadata

### Undo Last Upload

**Access:** Command Palette → `Mdimgup: Undo Last Upload`

**What it does:**
1. Finds the most recent upload in the current document
2. Reverts the CDN link back to the original local path
3. Optionally deletes the file from S3 storage

**Example:**
```markdown
Before undo:
![Screenshot](https://cdn.example.com/blog/1700000000000-screenshot.png)

After undo:
![Screenshot](./images/screenshot.png)
```

**Options:**
- **Revert link only**: Keeps file in S3, just reverts Markdown link
- **Revert + delete from S3**: Removes file from storage (cannot be undone)

**Safety checks:**
- ✅ Only reverts if original local file still exists
- ✅ Warns before deleting from S3
- ✅ Shows file details before confirmation

### Clear Upload History

**Access:** Command Palette → `Mdimgup: Clear Upload History`

**Options:**
- **All history**: Clear all records
- **Older than 30 days**: Keep recent uploads
- **Older than 90 days**: Archive old history

**Note:** This only clears history records from VS Code. Files remain in S3 storage.

### History Storage

**Automatic management:**
- 🗄️ Stores up to 1,000 upload records
- 🔄 Oldest records auto-deleted when limit reached
- 💾 Persists across VS Code sessions
- 🔒 Stored locally in VS Code's global state

**Record metadata:**
- Original file path
- Uploaded CDN URL
- Upload key (S3 object key)
- Profile used
- Document URI
- Timestamp
- File size and hash

### Use Cases

**Scenario 1: Wrong Image Uploaded**
```
1. Upload images to blog post
2. Notice wrong screenshot included
3. Command Palette → "Undo Last Upload"
4. Choose "Revert link + delete from S3"
5. Upload correct image
```

**Scenario 2: Cleaning Up Test Uploads**
```
1. Command Palette → "View Upload History"
2. Filter by current document
3. Select test uploads → "Undo Upload"
4. Choose "Revert + delete from S3"
5. Clean workspace and storage
```

**Scenario 3: Finding Old Images**
```
1. Command Palette → "View Upload History"
2. Browse recent uploads
3. Select image → "Open Document"
4. Jump to document containing the image
5. Or "Copy URL" to reuse elsewhere
```

**Pro Tips:**
- Use "Revert link only" if you want to keep the CDN URL for future use
- Use "Revert + delete from S3" to completely remove mistakes
- Regularly clear old history to keep records relevant
- History survives VS Code restarts and updates

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔮 Roadmap

- [x] **Multi-provider support** - Cloudflare R2, AWS S3, MinIO, and more
- [x] **Multi-profile management** - Save and switch between configurations
- [x] **Secure credential storage** - VS Code keychain integration
- [x] **Workspace-aware profiles** - Auto-select based on workspace
- [x] **Custom naming patterns** - User-defined filename templates
- [x] **Upload history** - Track uploaded images with undo capability
- [ ] **Profile templates** - Pre-configured profiles for popular providers
- [ ] **Batch operations** - Upload multiple Markdown files at once
- [ ] **Image optimization** - WebP conversion, compression options
- [ ] **Azure Blob Storage** - Native support (non-S3)
- [ ] **Google Cloud Storage** - Native support (non-S3)

See the [open issues](https://github.com/leonwong282/mdimgup/issues) for feature requests and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📜 Release Notes

### 0.2.1 (Latest) - Multi-Profile Support + Naming Patterns + Upload History

**Major Features:**
- 🎉 **Multi-Profile System**: Save and manage unlimited storage configurations
- 🎨 **Custom Naming Patterns**: Control uploaded filenames with variables ({timestamp}, {date}, {filename}, {hash}, {profile}, {counter}, {random})
- 📜 **Upload History & Undo**: Track uploads, revert links, and optionally delete from S3
- 🔐 **Secure Credentials**: Stored in VS Code's secure keychain (Secret Storage API)
- 📊 **Status Bar Integration**: Always see your active profile
- ⌨️ **Quick Switch**: Change profiles with `Ctrl+Alt+P` / `Cmd+Alt+P`
- 🗂️ **Workspace Profiles**: Auto-select profile based on workspace
- 📤 **Import/Export**: Share profile templates with team (credentials excluded)
- 🔄 **Automatic Migration**: Seamlessly upgrade from legacy single-config

**New Commands:**
- **Profiles**: Create, Edit, Delete, Duplicate, Select Active, Quick Switch, List All, Import/Export
- **Upload**: Upload with Profile Selection
- **History**: View Upload History, Undo Last Upload, Clear Upload History

See [CHANGELOG.md](CHANGELOG.md) for full details.


<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions.

### Quick Contribution Steps

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 👥 Authors

- **Leon Wong** - *Initial work* - [leonwong282](https://github.com/leonwong282)

See also the list of [contributors](https://github.com/leonwong282/mdimgup/contributors) who participated in this project.

## 🙏 Acknowledgments

This extension was built with:

### 🛠️ Development Tools
- **[VS Code Extension API](https://code.visualstudio.com/api)** - Platform foundation
- **[AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3)** - S3 client
- **[Sharp](https://sharp.pixelplumbing.com/)** - Image processing
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development

### 💡 Inspiration
- **[VS Code Secret Storage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)** - Secure credential storage
- **[AWS CLI](https://aws.amazon.com/cli/)** - S3 API patterns
- **GitHub Community** - Continuous feedback and support

### 🌟 Special Thanks
- **Cloudflare R2** - Zero egress fees for content creators
- **Open Source Contributors** - Who make projects like this possible
- **Early adopters** - Your feedback shaped this extension

---

**⭐ Star this repository if it helped you!**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📞 Support

- 📝 [Open an issue](https://github.com/leonwong282/mdimgup/issues/new)
- 💬 [Start a discussion](https://github.com/leonwong282/mdimgup/discussions)
- 📧 Email: leonwong282@gmail.com
- 🌐 Blog: [leonwong282.com](https://leonwong282.com/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<div align="center">

**Made with ❤️ by [Leon](https://github.com/leonwong282)**

For more info, see [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

</div>
