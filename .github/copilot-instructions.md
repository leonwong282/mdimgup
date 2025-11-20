# Copilot Instructions for mdimgup Extension

## Project Overview
- **mdimgup** is a VS Code extension for uploading images in Markdown files to Cloudflare R2 storage and updating image links in-place.
- Main logic is in `src/extension.ts`. Tests are in `src/test/extension.test.ts`.
- The extension registers the command `mdimgup.uploadImages`, available in the context menu for Markdown files.

````instructions
# Copilot Instructions — mdimgup

Purpose: help AI coding agents become productive quickly in this repo.

Core facts
- Main runtime: `src/extension.ts` — registers `mdimgup.uploadImages` and implements the complete upload flow.
- Command activation: contributed in `package.json` and added to editor context menu when `resourceLangId == markdown`.
- **Multi-provider support**: Supports Cloudflare R2, AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, and any S3-compatible service.

Architecture & important patterns (small actionable notes)
- Image discovery: regex in `src/extension.ts` matches `![](<path>)` and processes local paths only (HTTP URLs are skipped).
- Upload flow: read file → optional resize via `sharp` (GIFs are skipped) → compute MD5 via `crypto-js` → upload with `@aws-sdk/client-s3` → replace link in document.
- Cache: in-memory Map keyed by MD5 (`cache`), session-scoped and not persisted — re-running a new host clears it.
- **Configuration resolution**: `resolveStorageConfig()` auto-detects legacy R2 settings vs. new generic settings for backward compatibility.
- **S3Client creation**: `createS3Client()` builds provider-specific S3Client instances:
  - `cloudflare-r2`: Uses `https://${accountId}.r2.cloudflarestorage.com` endpoint
  - `aws-s3`: Uses default AWS SDK endpoint with user-specified region
  - `s3-compatible`: Uses custom `endpoint` from settings
- Upload key pattern: `${pathPrefix}${pathPrefix ? '/' : ''}${Date.now()}-${basename(file)}` (pathPrefix is configurable, default: `blog`).
- URLs: `${cdnDomain}${cdnDomain.endsWith('/') ? '' : '/'}${key}` (handles trailing slash).
- Concurrency: controlled by `p-limit` with `mdimgup.parallelUploads` from settings.

Developer workflows (exact commands)
- Compile: `npm run compile` (runs `tsc -p ./`).
- Watch during editing: `npm run watch` (recommended while iterating on `src/`).
- Lint: `npm run lint` (runs `eslint src`).
- Test: `npm run test` (uses `vscode-test` harness; `pretest` compiles + lints first).

Settings and safety
- **Generic settings** (v0.1.0+, still supported): `storageProvider`, `endpoint`, `region`, `bucket`, `accessKey`, `secretKey`, `accountId`, `cdnDomain`, `pathPrefix`
- **Profile settings** (v0.2.0+, recommended): Managed via ProfileManager with secure credential storage
- **Removed settings** (v0.0.1, no longer supported): `r2AccountId`, `r2Bucket`, `r2AccessKey`, `r2SecretKey`, `r2Domain`
- Required settings vary by provider:
  - `cloudflare-r2`: accountId, bucket, accessKey, secretKey, cdnDomain
  - `aws-s3`: region, bucket, accessKey, secretKey, cdnDomain
  - `s3-compatible`: endpoint, bucket, accessKey, secretKey, cdnDomain
- The extension will error and show a provider-aware message if any required settings are missing.
- Helpful defaults are in `package.json` under `contributes.configuration` (see `maxWidth`, `parallelUploads`, `useCache`, `pathPrefix`).

Places to change when extending features
- To add a new setting: update `package.json` `contributes.configuration` and read it in `src/extension.ts` with `vscode.workspace.getConfiguration('mdimgup')`.
- To add a new storage provider: update `StorageProvider` type, add case in `createS3Client()`, update documentation.
- To change upload behavior (key name, metadata): edit the `PutObjectCommand` invocation in `src/extension.ts`.
- To persist cache between sessions: replace the in-memory `Map` with storage in `vscode.Memento` (`context.globalState`) and manage serialization.

Tests and debugging
- Tests live in `src/test/extension.test.ts` and use the VS Code extension test harness. Run `npm run test` after `npm run compile`.
- Debugging: use VS Code's Extension Development Host; set breakpoints in `out/extension.js` after compiling, or attach the debug task to the TypeScript build.

Key files quick reference
- `src/extension.ts` — main logic, image processing, upload flow, and multi-provider configuration.
- `package.json` — commands, activation, configuration schema, and scripts.
- `src/test/extension.test.ts` — minimal test harness.
- `REQUIREMENTS.md` — comprehensive requirements document for S3-compatible support.
- `README.md` — user-facing documentation with provider-specific setup guides.

Agent rules (do these every time)
- Always read `package.json` and `src/extension.ts` before proposing changes that touch activation, settings, or upload behavior.
- Do not add persistent secrets to the repo. If testing uploads, instruct the user to set `mdimgup.*` in workspace settings or environment-managed secrets.
- Preserve the existing command name `mdimgup.uploadImages` unless intentionally creating a breaking change; update `package.json` accordingly.
- When adding new providers, ensure `resolveStorageConfig()` and `createS3Client()` are updated, and add documentation to `README.md`.

Ask the user before making these changes
- Add persisted caching (globalState) — may change behavior for users.
- Change the upload key scheme (affects downstream URLs and existing posts).
- Remove deprecated `r2*` settings (breaking change for legacy users).

If something isn't discoverable
- If you need storage credentials or an example domain, ask the user — this repo intentionally doesn't include credentials.
- For provider-specific testing, refer to `REQUIREMENTS.md` Section 6.2 for integration test scenarios.

References
- Implementation: `src/extension.ts`
- Config/schema: `package.json` (`contributes.configuration`)
- Scripts: `package.json` (`scripts`)
- Requirements: `REQUIREMENTS.md` (comprehensive S3-compatible support design)

````
- Update this file if new workflows or conventions are introduced.
