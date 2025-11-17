# Change Log

All notable changes to the "mdimgup" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
