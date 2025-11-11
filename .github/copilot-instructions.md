# Copilot Instructions for mdimgup Extension

## Project Overview
- **mdimgup** is a VS Code extension for uploading images in Markdown files to Cloudflare R2 storage and updating image links in-place.
- Main logic is in `src/extension.ts`. Tests are in `src/test/extension.test.ts`.
- The extension registers the command `mdimgup.uploadImages`, available in the context menu for Markdown files.

## Architecture & Data Flow
- On command execution, scans the active Markdown file for image links (`![alt](path)`), processes each image, uploads to R2, and replaces the link in the document.
- Uses Cloudflare R2 via AWS S3 API (`@aws-sdk/client-s3`).
- Images are resized (except GIFs) using `sharp` if wider than the configured max width.
- Uploads are parallelized using `p-limit` (configurable concurrency).
- Caching is used to avoid re-uploading identical images (MD5 hash).
- All configuration is read from VS Code settings (`mdimgup.*`).

## Developer Workflows
- **Build:**
  - `npm run compile` — Compile TypeScript
  - `npm run watch` — Watch and recompile on changes
- **Lint:**
  - `npm run lint` — Run ESLint on `src/`
- **Test:**
  - `npm run test` — Run extension tests (minimal sample test provided)
- **Debug:**
  - Use VS Code extension development host

## Key Patterns & Conventions
- All image uploads are triggered via the command, not automatically.
- Only local image paths are uploaded; remote URLs are skipped.
- Image links are updated in-place in the Markdown file after upload.
- Settings are required for R2 credentials and domain; extension will error if missing.
- Uploaded images are stored under `blog/<timestamp>-<filename>` in the R2 bucket.
- Uses in-memory cache for session-level deduplication (not persisted).

## Integration Points
- Relies on VS Code APIs for editor/document access and progress notifications.
- External dependencies: `@aws-sdk/client-s3`, `sharp`, `mime-types`, `crypto-js`, `p-limit`.
- No custom file/folder structure beyond standard VS Code extension layout.

## Example Settings
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

## References
- Main logic: `src/extension.ts`
- Settings: `package.json` (`contributes.configuration`)
- Build/test scripts: `package.json` (`scripts`)
- Minimal test: `src/test/extension.test.ts`

---

**For AI agents:**
- Always check for required settings before running upload logic.
- Follow the established command/activation pattern for new features.
- Use the provided build/lint/test scripts for CI/CD or local development.
- Update this file if new workflows or conventions are introduced.
