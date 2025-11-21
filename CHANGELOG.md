# Change Log

All notable changes to the "mdimgup" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.2.1] - 2026-1

### Added

- 🎨 **Custom Naming Patterns**: Control uploaded filename formats with variables
  - 10 pattern variables: `{timestamp}`, `{date}`, `{time}`, `{datetime}`, `{filename}`, `{ext}`, `{hash:N}`, `{profile}`, `{counter}`, `{random:N}`
  - 6 predefined pattern templates with descriptions
  - Pattern validation with real-time preview
  - Per-profile naming pattern configuration
- 📜 **Upload History & Undo**: Track uploaded images and revert with one command
  - Store up to 1,000 upload records (auto-cleanup oldest)
  - View recent uploads with metadata (profile, size, timestamp, document)
  - Undo last upload: revert link + optionally delete from S3
  - History filtering by document, profile, and date range
  - Persistent across VS Code sessions
- 🎨 **Profile Management UI**:
  - Edit, delete, duplicate profile commands (now with full editing: rename, description, provider settings, CDN/path, naming pattern, credentials)
- 🆕 **New Commands**:
  - **Upload History**: `Mdimgup: View Upload History`, `Mdimgup: Undo Last Upload`, `Mdimgup: Clear Upload History`

### Technical

- New `UploadHistoryManager` class for history tracking and CRUD operations
- New `NamingPatternRenderer` class for pattern parsing and filename generation
- New `registerHistoryCommands()` for history UI commands
- Upload history stored in `globalState` (max 1000 records with auto-cleanup)

## [0.2.0] - 2025-12

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
  - List all profiles with detailed information
- 📤 **Import/Export Profiles**: Share profile templates with team (credentials excluded for security)
- 🔄 **Automatic Migration**: Seamlessly migrate from legacy single-config to profiles
- 📍 **Profile Metadata**: Track profile creation, updates, and last used timestamps
- 🆕 **New Commands**:
  - **Profile Management**: `Mdimgup: Create Storage Profile`, `Mdimgup: Select Active Profile`, `Mdimgup: Quick Switch Profile`, `Mdimgup: Edit Storage Profile`, `Mdimgup: Delete Storage Profile`, `Mdimgup: Duplicate Storage Profile`, `Mdimgup: List All Profiles`, `Mdimgup: Import Profile`, `Mdimgup: Export Profile`, `Mdimgup: Upload with Profile Selection`
- ⚙️ **New Settings**:
  - `mdimgup.activeProfile` - ID of currently active profile
  - `mdimgup.showProfileInStatusBar` - Toggle status bar visibility
  - `mdimgup.promptMigration` - Control migration prompts

### Changed
- 📝 Upload notifications now include profile name for clarity
- 🔄 Profile resolution hierarchy: workspace profile → global profile → legacy config
- 🎯 Upload command automatically prompts for profile creation if none exists
- 🖊️ All profile commands now prefixed with "Mdimgup:" for consistency
- 🗑️ **BREAKING**: Removed legacy R2-specific settings (`r2AccountId`, `r2Bucket`, `r2AccessKey`, `r2SecretKey`, `r2Domain`) - use profiles or v0.1.0 generic settings instead
- ✏️ Edit Profile command expanded to full menu (7 options: rename, description, provider settings, CDN/path, naming pattern, credentials, set active)

### Technical
- New `ProfileManager` class for CRUD operations and credential management
- New `ProfileStatusBar` class for status bar integration
- New `UploadHistoryManager` class for history tracking and CRUD operations
- New `NamingPatternRenderer` class for pattern parsing and filename generation
- New `registerProfileCommands()` for UI command registration
- New `registerHistoryCommands()` for history UI commands
- Profile data stored in `globalState` (syncs via Settings Sync)
- Upload history stored in `globalState` (max 1000 records with auto-cleanup)
- Credentials stored in Secret Storage API (local-only, secure)
- Full backward compatibility with legacy v0.1.0 generic settings

## [0.1.0] - 2025-11

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
