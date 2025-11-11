
# mdimgup: Markdown Image Upload for VS Code

`mdimgup` is a VS Code extension that uploads local images referenced in Markdown files to Cloudflare R2 storage, then updates the image links in-place.

## Features
- Scan Markdown files for local image links (`![alt](path)`)
- Resize images (except GIFs) to a configurable max width before upload
- Upload images to Cloudflare R2 using AWS S3 API
- Replace Markdown image links with CDN URLs after upload
- Parallel uploads with configurable concurrency
- In-memory cache to avoid duplicate uploads in a session

## Requirements
- Cloudflare R2 account and bucket
- R2 credentials and domain configured in VS Code settings
- Only local image paths are uploaded; remote URLs are skipped

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
2. Right-click and select **Upload Markdown Images to R2** from the context menu
3. Wait for the progress notification; image links will be updated automatically

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
- Extension will error if R2 settings are missing
- Only supports local image paths

## Release Notes

See `CHANGELOG.md` for details.

---

For more info, see [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).
