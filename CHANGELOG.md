# Change Log

All notable changes to the "mdimgup" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.2.0] - 2025-11-19

### Added
- 🎉 **Multi-Profile Support**: Save and manage multiple storage configurations
  - Create unlimited named storage profiles with friendly names
  - Quick switch between profiles via status bar or keyboard shortcut (`Ctrl+Alt+P` / `Cmd+Alt+P`)
  - Workspace-specific profile defaults (auto-select profile based on workspace)
  - Profile-specific upload settings (maxWidth, parallelUploads, useCache)
- 🔐 **Secure Credential Management**: Credentials stored in VS Code Secret Storage (keychain)
- 📊 **Status Bar Integration**: Shows active profile with click-to-switch functionality
- 🎨 **Profile Management UI**:
  - Interactive profile creation wizard with step-by-step guidance
  - Profile selection with Quick Pick (sorted by most recently used)
  - Edit, delete, duplicate profile commands
  - List all profiles with detailed information
- 📤 **Import/Export Profiles**: Share profile templates with team (credentials excluded for security)
- 🔄 **Automatic Migration**: Seamlessly migrate from legacy single-config to profiles
- 📍 **Profile Metadata**: Track profile creation, updates, and last used timestamps
- 🆕 **New Commands**:
  - `Upload Images with Profile Selection` - One-off upload to specific profile
  - `Create Storage Profile` - Launch profile creation wizard
  - `Select Active Profile` - Choose active profile
  - `Quick Switch Profile` - Fast profile switching (Ctrl+Alt+P)
  - `Edit Storage Profile` - Modify existing profiles
  - `Delete Storage Profile` - Remove profiles
  - `Duplicate Storage Profile` - Copy profiles (without credentials)
  - `List All Profiles` - View all configured profiles
  - `Import Profile` - Import profile from JSON file
  - `Export Profile` - Export profile to JSON file
- ⚙️ **New Settings**:
  - `mdimgup.activeProfile` - ID of currently active profile
  - `mdimgup.showProfileInStatusBar` - Toggle status bar visibility
  - `mdimgup.promptMigration` - Control migration prompts

### Changed
- 📝 Upload notifications now include profile name for clarity
- 🔄 Profile resolution hierarchy: workspace profile → global profile → legacy config
- 🎯 Upload command automatically prompts for profile creation if none exists

### Technical
- New `ProfileManager` class for CRUD operations and credential management
- New `ProfileStatusBar` class for status bar integration
- New `registerProfileCommands()` for UI command registration
- Profile data stored in `globalState` (syncs via Settings Sync)
- Credentials stored in Secret Storage API (local-only, secure)
- Full backward compatibility with legacy single-config settings

## [0.1.0] - 2025-11-17

### Added
- 🎉 **Multi-provider support**: Extended beyond Cloudflare R2 to support any S3-compatible storage service
- ✨ New generic configuration settings:
  - `mdimgup.storageProvider` - Choose between `cloudflare-r2`, `aws-s3`, or `s3-compatible`
  - `mdimgup.endpoint` - Custom S3 endpoint URL for S3-compatible services
  - `mdimgup.region` - AWS region configuration
  - `mdimgup.bucket` - Generic bucket name setting
  - `mdimgup.accessKey` - Generic access key setting
  - `mdimgup.secretKey` - Generic secret key setting
  - `mdimgup.accountId` - Cloudflare R2 account ID (replaces `r2AccountId`)
  - `mdimgup.cdnDomain` - Generic CDN domain setting (replaces `r2Domain`)
  - `mdimgup.pathPrefix` - Customizable upload path prefix (default: `blog`)
- 📚 Comprehensive provider-specific setup documentation:
  - Cloudflare R2 setup guide
  - AWS S3 setup guide
  - MinIO setup guide
  - DigitalOcean Spaces setup guide
  - Backblaze B2 setup guide
- 🔄 Automatic configuration migration from legacy R2 settings
- 🎨 Provider-aware UI messages (progress notifications, success messages)

### Changed
- 🔄 Command title updated from "Upload Markdown Images to R2" to "Upload Markdown Images to Cloud Storage"
- 📝 Legacy `r2*` settings marked as deprecated (but still fully supported for backward compatibility)
- 🛠️ Refactored internal architecture with `resolveStorageConfig()` and `createS3Client()` helper functions
- 📖 Updated README with multi-provider documentation and examples

### Fixed
- 🐛 CDN URL construction now properly handles trailing slashes in `cdnDomain`

## [0.0.1] - Initial Release

### Added
- Initial release with Cloudflare R2-only support
- Image scanning in Markdown files
- Automatic image resizing (except GIFs)
- Parallel upload with configurable concurrency
- In-memory caching for duplicate detection
- MD5-based image deduplication
