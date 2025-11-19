# mdimgup: Markdown Image Upload for VS Code

`mdimgup` is a VS Code extension that uploads local images referenced in Markdown files to S3-compatible cloud storage (Cloudflare R2, AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, etc.), then updates the image links in-place.

## Features
- Scan Markdown files for local image links (`![alt](path)`)
- Resize images (except GIFs) to a configurable max width before upload
- Upload images to any S3-compatible storage using AWS S3 API
- Replace Markdown image links with CDN URLs after upload
- Parallel uploads with configurable concurrency
- In-memory cache to avoid duplicate uploads in a session
- Support for multiple storage providers: Cloudflare R2, AWS S3, MinIO, DigitalOcean Spaces, and more

## Requirements
- An S3-compatible storage account and bucket (see [Supported Providers](#supported-providers))
- Storage credentials and domain configured in VS Code settings
- Only local image paths are uploaded; remote URLs are skipped

## Supported Providers

- ✅ **Cloudflare R2** - Object storage with zero egress fees
- ✅ **AWS S3** - Amazon's industry-standard object storage
- ✅ **MinIO** - Self-hosted S3-compatible storage
- ✅ **DigitalOcean Spaces** - Simple object storage with CDN
- ✅ **Backblaze B2** - Affordable cloud storage
- ✅ **Any S3-compatible service** - Use the `s3-compatible` provider mode

## Extension Settings

### Quick Start: Choose Your Provider

<details>
<summary><strong>Cloudflare R2</strong> (Recommended for blogs)</summary>

```json
{
	"mdimgup.storageProvider": "cloudflare-r2",
	"mdimgup.accountId": "your_account_id",
	"mdimgup.bucket": "my-blog-images",
	"mdimgup.accessKey": "your_access_key",
	"mdimgup.secretKey": "your_secret_key",
	"mdimgup.cdnDomain": "https://cdn.example.com",
	"mdimgup.pathPrefix": "blog",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

**How to get credentials:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create a bucket
3. Create an API token with R2 read/write permissions
4. Set up a custom domain for your bucket

</details>

<details>
<summary><strong>AWS S3</strong></summary>

```json
{
	"mdimgup.storageProvider": "aws-s3",
	"mdimgup.region": "us-east-1",
	"mdimgup.bucket": "my-blog-images",
	"mdimgup.accessKey": "AKIAIOSFODNN7EXAMPLE",
	"mdimgup.secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
	"mdimgup.cdnDomain": "https://my-blog-images.s3.amazonaws.com",
	"mdimgup.pathPrefix": "images",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

**How to get credentials:**
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create an IAM user with S3 permissions
3. Create access keys for the user
4. Create an S3 bucket in your desired region
5. Configure bucket permissions (public read or CloudFront)

</details>

<details>
<summary><strong>MinIO</strong> (Self-hosted)</summary>

```json
{
	"mdimgup.storageProvider": "s3-compatible",
	"mdimgup.endpoint": "https://minio.example.com",
	"mdimgup.bucket": "blog",
	"mdimgup.accessKey": "minioadmin",
	"mdimgup.secretKey": "minioadmin",
	"mdimgup.cdnDomain": "https://minio.example.com/blog",
	"mdimgup.pathPrefix": "",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

**How to set up:**
1. Install MinIO: `docker run -p 9000:9000 minio/minio server /data`
2. Access MinIO Console (default: http://localhost:9000)
3. Create a bucket and access keys
4. Set bucket policy to public if needed

</details>

<details>
<summary><strong>DigitalOcean Spaces</strong></summary>

```json
{
	"mdimgup.storageProvider": "s3-compatible",
	"mdimgup.endpoint": "https://nyc3.digitaloceanspaces.com",
	"mdimgup.region": "nyc3",
	"mdimgup.bucket": "my-space",
	"mdimgup.accessKey": "DO00EXAMPLE",
	"mdimgup.secretKey": "your_secret_key",
	"mdimgup.cdnDomain": "https://my-space.nyc3.cdn.digitaloceanspaces.com",
	"mdimgup.pathPrefix": "blog",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

**How to get credentials:**
1. Go to [DigitalOcean Cloud](https://cloud.digitalocean.com/spaces)
2. Create a Space in your preferred region
3. Generate API keys under API → Spaces Keys
4. Enable CDN for your Space (recommended)

</details>

<details>
<summary><strong>Backblaze B2</strong></summary>

```json
{
	"mdimgup.storageProvider": "s3-compatible",
	"mdimgup.endpoint": "https://s3.us-west-001.backblazeb2.com",
	"mdimgup.bucket": "my-bucket",
	"mdimgup.accessKey": "your_key_id",
	"mdimgup.secretKey": "your_application_key",
	"mdimgup.cdnDomain": "https://f001.backblazeb2.com/file/my-bucket",
	"mdimgup.pathPrefix": "blog",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

**How to get credentials:**
1. Go to [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Create a bucket
3. Create an application key with read/write access
4. Use the S3-compatible endpoint for your region

</details>

### All Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mdimgup.storageProvider` | `"cloudflare-r2"` \| `"aws-s3"` \| `"s3-compatible"` | `""` (auto-detect) | Storage provider type |
| `mdimgup.endpoint` | string | `""` | Custom S3 endpoint (required for s3-compatible) |
| `mdimgup.region` | string | `"auto"` | AWS region (e.g., `us-east-1`) |
| `mdimgup.bucket` | string | `""` | S3 bucket name |
| `mdimgup.accessKey` | string | `""` | S3 access key ID |
| `mdimgup.secretKey` | string | `""` | S3 secret access key |
| `mdimgup.accountId` | string | `""` | Cloudflare R2 account ID (R2 only) |
| `mdimgup.cdnDomain` | string | `""` | CDN domain for uploaded images |
| `mdimgup.pathPrefix` | string | `"blog"` | Path prefix for uploads (e.g., `images`, `uploads/2025`) |
| `mdimgup.maxWidth` | number | `1280` | Max image width (px) before resize |
| `mdimgup.parallelUploads` | number | `5` | Number of concurrent uploads |
| `mdimgup.useCache` | boolean | `true` | Cache uploaded images (session-only) |

### Legacy R2 Settings (Deprecated)

If you're using the old R2-specific settings, they will continue to work but are deprecated:

```json
{
	"mdimgup.r2AccountId": "...",
	"mdimgup.r2Bucket": "...",
	"mdimgup.r2AccessKey": "...",
	"mdimgup.r2SecretKey": "...",
	"mdimgup.r2Domain": "..."
}
```

**Migration:** Replace `r2*` settings with the new generic settings above. Your existing configuration will work without changes.

## Usage
1. Open a Markdown file in VS Code
2. Right-click and select **Upload Markdown Images to Cloud Storage** from the context menu
3. Wait for the progress notification; image links will be updated automatically

## Extension Settings
Configure these in your VS Code settings:

```json
{
	"mdimgup.r2AccountId": "...",
	"mdimgup.r2Bucket": "...",
	"mdimgup.r2AccessKey": "...",
	"mdimgup.r2SecretKey": "...",
	"mdimgup.r2Domain": "https://your.cdn.domain",
	"mdimgup.maxWidth": 1280,
	"mdimgup.parallelUploads": 5,
	"mdimgup.useCache": true
}
```

## Usage
1. Open a Markdown file in VS Code
2. Right-click and select **Upload Markdown Images to Cloud Storage** from the context menu
3. Wait for the progress notification; image links will be updated automatically

## Examples

### Before Upload
```markdown
![My Screenshot](./images/screenshot.png)
![Diagram](../assets/diagram.jpg)
```

### After Upload
```markdown
![My Screenshot](https://cdn.example.com/blog/1700000000000-screenshot.png)
![Diagram](https://cdn.example.com/blog/1700000000001-diagram.jpg)
```

## Developer Workflows
- **Build:** `npm run compile` or `npm run watch`
- **Lint:** `npm run lint`
- **Test:** `npm run test` (see `src/test/extension.test.ts`)
- **Debug:** Use VS Code extension development host (F5)

## Key Files
- Main logic: `src/extension.ts`
- Tests: `src/test/extension.test.ts`
- Settings & commands: `package.json`

## Known Issues
- Extension will error if storage provider settings are missing or incomplete
- Only supports local image paths (remote URLs are skipped intentionally)
- Session-only cache (clears when VS Code restarts)

## Troubleshooting

### "Storage configuration missing" error
- Check that all required settings for your provider are configured
- For Cloudflare R2: `accountId`, `bucket`, `accessKey`, `secretKey`, `cdnDomain`
- For AWS S3: `region`, `bucket`, `accessKey`, `secretKey`, `cdnDomain`
- For S3-compatible: `endpoint`, `bucket`, `accessKey`, `secretKey`, `cdnDomain`

### Images not uploading
- Verify your credentials have write permissions to the bucket
- Check that the bucket exists and is accessible
- Ensure the bucket allows public read access (or configure your CDN)

### CDN URLs not working
- Verify `cdnDomain` is correctly configured
- Check bucket CORS settings if accessing from web
- Ensure custom domain DNS is properly configured (for R2/Spaces)

## Release Notes

### 0.1.0 (Latest)
- 🎉 **Multi-provider support**: Now supports AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, and any S3-compatible service
- ✨ New generic settings: `storageProvider`, `endpoint`, `region`, `bucket`, `accessKey`, `secretKey`, `cdnDomain`, `pathPrefix`
- 🔄 100% backward compatible with existing R2 configurations
- 📝 Deprecated legacy `r2*` settings (still supported)
- 🎨 Updated command title to "Upload Markdown Images to Cloud Storage"
- 🛠️ Customizable path prefix (no longer hardcoded to `blog/`)
- 📚 Comprehensive documentation with provider-specific setup guides

### 0.0.1
- Initial release with Cloudflare R2 support

See `CHANGELOG.md` for details.

---

For more info, see [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).
