# Requirements Document: S3-Compatible Storage Support for mdimgup

**Document Version:** 1.0  
**Date:** November 17, 2025  
**Author:** AI Assistant  
**Status:** Draft for Review

---

## Executive Summary

The mdimgup VS Code extension currently provides Markdown image upload functionality exclusively for Cloudflare R2 storage. This document outlines requirements to expand support to any S3-compatible storage service (AWS S3, MinIO, DigitalOcean Spaces, Backblaze B2, Wasabi, etc.) while maintaining backward compatibility with existing R2 configurations.

---

## 1. Current State Analysis

### 1.1 Architecture Overview

**Technology Stack:**
- Runtime: VS Code Extension (TypeScript)
- Storage SDK: `@aws-sdk/client-s3` (v3)
- Image Processing: `sharp` (resize), `crypto-js` (MD5 hashing)
- Concurrency: `p-limit`
- Additional: `mime-types`, `fs`, `path`

**Core Components:**
- `src/extension.ts` — Single-file implementation containing:
  - Command registration (`mdimgup.uploadImages`)
  - Image discovery (regex-based Markdown parsing)
  - Upload pipeline (resize → hash → upload → replace)
  - In-memory cache (MD5-based deduplication)
- `package.json` — Extension manifest with configuration schema
- `src/test/extension.test.ts` — Minimal test harness

### 1.2 R2-Specific Dependencies

**Hard-coded R2 Elements:**

1. **Endpoint Construction** (Line 34 in `src/extension.ts`):
   ```typescript
   endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
   ```
   - Uses R2-specific domain pattern
   - Requires `r2AccountId` to construct endpoint
   - Not compatible with generic S3 endpoints

2. **Configuration Schema** (`package.json`):
   ```json
   "mdimgup.r2AccountId": { "type": "string" }
   "mdimgup.r2Bucket": { "type": "string" }
   "mdimgup.r2AccessKey": { "type": "string" }
   "mdimgup.r2SecretKey": { "type": "string" }
   "mdimgup.r2Domain": { "type": "string" }
   ```
   - All settings prefixed with `r2*`
   - Naming implies R2-only support

3. **Error Messages**:
   - "R2 config missing — fill settings first."
   - User-facing messages reference R2 explicitly

4. **Documentation**:
   - `README.md`: "Cloudflare R2 account and bucket" required
   - Extension description: "uploads to Cloudflare R2 storage"
   - Command title: "Upload Markdown Images to R2"

5. **Upload Key Pattern** (Line 68):
   ```typescript
   const key = `blog/${Date.now()}-${path.basename(fullPath)}`;
   ```
   - Uses `blog/` prefix (may be R2-specific convention)

### 1.3 Current Workflow

```
User triggers command
  ↓
Validate R2 settings (accountId, bucket, keys, domain)
  ↓
Create S3Client with R2 endpoint
  ↓
Scan Markdown for local images (regex: /!\[.*?\]\((.*?)\)/g)
  ↓
For each image (parallel with p-limit):
  ├─ Skip if HTTP URL
  ├─ Read file buffer
  ├─ Compute MD5 hash
  ├─ Check in-memory cache
  ├─ Resize if needed (except GIFs)
  ├─ Upload to R2 (PutObjectCommand)
  └─ Update cache and replace link in content
  ↓
Apply edits to document
  ↓
Show success notification
```

---

## 2. Business Goals & User Needs

### 2.1 Primary Goal
Enable users to upload Markdown images to **any S3-compatible storage service**, not just Cloudflare R2.

### 2.2 Target User Personas

1. **Current R2 Users**
   - Should experience **zero breaking changes**
   - Existing configurations must continue working
   - No migration effort required

2. **AWS S3 Users**
   - Need region selection (e.g., `us-east-1`, `eu-west-1`)
   - May use custom endpoints (VPC endpoints, S3 Transfer Acceleration)
   - Require flexible bucket path configurations

3. **Alternative S3-Compatible Service Users**
   - MinIO (self-hosted or cloud)
   - DigitalOcean Spaces
   - Backblaze B2
   - Wasabi
   - Alibaba Cloud OSS
   - Require custom endpoint URLs

### 2.3 Success Criteria

- [x] Support 5+ S3-compatible services with minimal configuration
- [x] Maintain 100% backward compatibility with existing R2 configurations
- [x] No code changes required for existing users
- [x] Clear migration path for users who want to switch providers
- [x] Provider-specific documentation with examples

---

## 3. Functional Requirements

### 3.1 Storage Provider Selection

**FR-1.1: Provider Type Configuration**
- Add new setting: `mdimgup.storageProvider` (enum)
- Supported values:
  - `cloudflare-r2` (default for backward compatibility)
  - `aws-s3`
  - `s3-compatible` (generic for MinIO, Spaces, etc.)
- Auto-detect provider based on existing `r2*` settings if not specified

**FR-1.2: Dynamic Endpoint Construction**
- For `cloudflare-r2`: Use existing logic (`https://${accountId}.r2.cloudflarestorage.com`)
- For `aws-s3`: Use AWS SDK default endpoint (regional)
- For `s3-compatible`: Use custom endpoint from `mdimgup.endpoint` setting

### 3.2 Configuration Schema Redesign

**FR-2.1: Generic Settings (New)**
```json
{
  "mdimgup.storageProvider": "cloudflare-r2",  // NEW
  "mdimgup.endpoint": "",                       // NEW (for s3-compatible)
  "mdimgup.region": "auto",                     // NEW (for aws-s3)
  "mdimgup.bucket": "",                         // NEW (generic)
  "mdimgup.accessKey": "",                      // NEW (generic)
  "mdimgup.secretKey": "",                      // NEW (generic)
  "mdimgup.cdnDomain": "",                      // NEW (generic)
  "mdimgup.pathPrefix": "blog",                 // NEW (customizable prefix)
}
```

**FR-2.2: Legacy Settings (Deprecated but Supported)**
- Keep all `mdimgup.r2*` settings for backward compatibility
- If `r2*` settings exist and new settings are empty, use legacy values
- Show deprecation warning on first use (optional)

**FR-2.3: Setting Validation**
- Required fields based on provider:
  - `cloudflare-r2`: accountId, bucket, accessKey, secretKey, cdnDomain
  - `aws-s3`: region, bucket, accessKey, secretKey, cdnDomain
  - `s3-compatible`: endpoint, bucket, accessKey, secretKey, cdnDomain
- Show helpful error messages indicating missing fields per provider

### 3.3 Endpoint & Region Handling

**FR-3.1: Cloudflare R2**
- Endpoint: `https://${accountId}.r2.cloudflarestorage.com`
- Region: `auto` (fixed)
- Account ID: Required

**FR-3.2: AWS S3**
- Endpoint: Automatic (AWS SDK default)
- Region: User-specified (e.g., `us-east-1`, `ap-northeast-1`)
- Account ID: Not required

**FR-3.3: S3-Compatible Services**
- Endpoint: User-specified full URL
  - Examples:
    - MinIO: `https://minio.example.com`
    - DigitalOcean Spaces: `https://nyc3.digitaloceanspaces.com`
    - Backblaze B2: `https://s3.us-west-001.backblazeb2.com`
- Region: Optional (default to `us-east-1` for compatibility)
- Account ID: Not required

### 3.4 Upload Key Pattern Customization

**FR-4.1: Path Prefix Setting**
- New setting: `mdimgup.pathPrefix` (default: `blog`)
- Allows users to customize folder structure
- Examples: `images`, `assets/blog`, `uploads/2025`
- Empty string allowed (root of bucket)

**FR-4.2: Key Generation Pattern**
```typescript
const key = `${pathPrefix}${pathPrefix ? '/' : ''}${Date.now()}-${path.basename(fullPath)}`;
```

**FR-4.3: CDN URL Construction**
- Use `mdimgup.cdnDomain` setting (replaces `r2Domain`)
- Full URL: `${cdnDomain}/${key}`
- Support both with/without trailing slash in cdnDomain

### 3.5 User Interface Updates

**FR-5.1: Command Title**
- Current: "Upload Markdown Images to R2"
- New: "Upload Markdown Images to Cloud Storage"
- Keep command ID unchanged: `mdimgup.uploadImages`

**FR-5.2: Error Messages**
- Replace "R2 config missing" with provider-aware messages
- Example: "Storage configuration missing. Configure {provider} settings first."

**FR-5.3: Progress Notifications**
- Replace "Uploading images to R2..." with "Uploading images to {provider}..."

### 3.6 Backward Compatibility

**FR-6.1: Automatic Migration**
- If `r2*` settings exist and new settings are empty:
  - Auto-map: `r2AccountId` → build R2 endpoint
  - Auto-map: `r2Bucket` → `bucket`
  - Auto-map: `r2AccessKey` → `accessKey`
  - Auto-map: `r2SecretKey` → `secretKey`
  - Auto-map: `r2Domain` → `cdnDomain`
  - Set provider to `cloudflare-r2`

**FR-6.2: No Breaking Changes**
- Existing configurations must work without modification
- Users should not notice any behavior change unless they opt-in to new settings

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Upload performance must match or exceed current implementation
- S3Client initialization should be cached per session
- No additional latency from provider detection logic

### 4.2 Security
- Credentials stored in VS Code settings (same as current)
- No credentials logged or exposed in error messages
- Support for environment variable fallback (future enhancement)

### 4.3 Compatibility
- VS Code version: ≥1.105.0 (same as current)
- Node.js: Compatible with VS Code's embedded Node
- AWS SDK: Continue using `@aws-sdk/client-s3` v3

### 4.4 Maintainability
- Keep single-file architecture (`src/extension.ts`)
- Modularize provider-specific logic into helper functions
- Maintain test coverage (enhance existing tests)

### 4.5 Usability
- Clear error messages for misconfiguration
- Provider-specific examples in documentation
- Settings should be easily discoverable in VS Code settings UI

---

## 5. Technical Design

### 5.1 Configuration Resolution Logic

```typescript
function resolveStorageConfig(cfg: vscode.WorkspaceConfiguration) {
  // Check if legacy R2 settings exist
  const hasLegacyR2 = cfg.get<string>("r2AccountId") && 
                      cfg.get<string>("r2Bucket");
  
  // Check if new generic settings exist
  const hasNewSettings = cfg.get<string>("bucket") && 
                         cfg.get<string>("accessKey");
  
  if (!hasNewSettings && hasLegacyR2) {
    // Use legacy R2 settings
    return {
      provider: "cloudflare-r2",
      accountId: cfg.get<string>("r2AccountId"),
      bucket: cfg.get<string>("r2Bucket"),
      accessKey: cfg.get<string>("r2AccessKey"),
      secretKey: cfg.get<string>("r2SecretKey"),
      cdnDomain: cfg.get<string>("r2Domain"),
      endpoint: null,
      region: "auto",
      pathPrefix: "blog"
    };
  }
  
  if (hasNewSettings) {
    // Use new generic settings
    const provider = cfg.get<string>("storageProvider") || "s3-compatible";
    return {
      provider,
      accountId: cfg.get<string>("accountId") || null,
      bucket: cfg.get<string>("bucket"),
      accessKey: cfg.get<string>("accessKey"),
      secretKey: cfg.get<string>("secretKey"),
      cdnDomain: cfg.get<string>("cdnDomain"),
      endpoint: cfg.get<string>("endpoint") || null,
      region: cfg.get<string>("region") || "auto",
      pathPrefix: cfg.get<string>("pathPrefix") || "blog"
    };
  }
  
  // No valid configuration
  return null;
}
```

### 5.2 S3Client Construction

```typescript
function createS3Client(config: StorageConfig): S3Client {
  const clientConfig: any = {
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey
    }
  };
  
  switch (config.provider) {
    case "cloudflare-r2":
      clientConfig.region = "auto";
      clientConfig.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
      break;
      
    case "aws-s3":
      clientConfig.region = config.region;
      // No custom endpoint (use AWS SDK default)
      break;
      
    case "s3-compatible":
      clientConfig.region = config.region || "us-east-1";
      clientConfig.endpoint = config.endpoint;
      break;
  }
  
  return new S3Client(clientConfig);
}
```

### 5.3 Settings Schema Migration

**Phase 1: Add New Settings (Non-Breaking)**
- Add all `mdimgup.*` generic settings to `package.json`
- Mark as optional (empty default values)
- Keep all `mdimgup.r2*` settings as-is

**Phase 2: Implement Resolution Logic**
- Modify `src/extension.ts` to use `resolveStorageConfig()`
- Test with both legacy and new configurations

**Phase 3: Documentation Update**
- Update `README.md` with multi-provider examples
- Add migration guide for R2 users
- Create provider-specific setup guides

**Phase 4: Deprecation (Future)**
- Add deprecation notice for `r2*` settings (v0.1.0+)
- Remove `r2*` settings in v1.0.0 (breaking change)

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Test Cases:**
1. Configuration resolution with legacy R2 settings
2. Configuration resolution with new generic settings
3. Configuration resolution with mixed settings (new takes precedence)
4. S3Client construction for each provider type
5. Endpoint URL generation for each provider
6. Path prefix handling (empty, single-level, multi-level)
7. CDN URL construction with/without trailing slash

### 6.2 Integration Tests

**Provider Testing (Manual/Automated):**
1. **Cloudflare R2**
   - Legacy configuration workflow
   - New configuration workflow
   - Upload test with actual R2 bucket
   
2. **AWS S3**
   - Multiple regions (us-east-1, eu-west-1)
   - Upload test with actual S3 bucket
   - Verify ACL/permissions handling
   
3. **MinIO**
   - Local MinIO instance
   - Custom endpoint configuration
   - Upload and retrieval test
   
4. **DigitalOcean Spaces**
   - Spaces endpoint configuration
   - CDN URL construction

5. **Backblaze B2**
   - B2 S3-compatible API endpoint
   - Upload test with B2 bucket

### 6.3 Backward Compatibility Tests

**Scenarios:**
1. Existing R2 user upgrades extension → No configuration change required
2. Existing R2 user sees no behavior change
3. New user configures AWS S3 → Works without R2 settings
4. User migrates from R2 to AWS → Migration guide works

### 6.4 Error Handling Tests

**Test Cases:**
1. Missing required settings per provider
2. Invalid endpoint URL
3. Invalid region
4. Network errors (timeout, DNS failure)
5. Authentication errors (invalid credentials)
6. Bucket not found / permission denied

---

## 7. Documentation Requirements

### 7.1 README.md Updates

**Required Sections:**
1. **Features** — Update to mention S3-compatible services
2. **Requirements** — Generalize from "Cloudflare R2 account"
3. **Extension Settings** — Add all new settings with examples
4. **Usage** — Update command title
5. **Provider-Specific Setup** — New section with:
   - Cloudflare R2 setup
   - AWS S3 setup
   - MinIO setup
   - DigitalOcean Spaces setup
   - Generic S3-compatible setup
6. **Migration Guide** — For existing R2 users

### 7.2 Configuration Examples

**Example: Cloudflare R2 (Legacy)**
```json
{
  "mdimgup.r2AccountId": "abc123",
  "mdimgup.r2Bucket": "my-blog-images",
  "mdimgup.r2AccessKey": "access_key_here",
  "mdimgup.r2SecretKey": "secret_key_here",
  "mdimgup.r2Domain": "https://cdn.example.com"
}
```

**Example: Cloudflare R2 (New)**
```json
{
  "mdimgup.storageProvider": "cloudflare-r2",
  "mdimgup.accountId": "abc123",
  "mdimgup.bucket": "my-blog-images",
  "mdimgup.accessKey": "access_key_here",
  "mdimgup.secretKey": "secret_key_here",
  "mdimgup.cdnDomain": "https://cdn.example.com",
  "mdimgup.pathPrefix": "blog"
}
```

**Example: AWS S3**
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

**Example: MinIO**
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

**Example: DigitalOcean Spaces**
```json
{
  "mdimgup.storageProvider": "s3-compatible",
  "mdimgup.endpoint": "https://nyc3.digitaloceanspaces.com",
  "mdimgup.region": "nyc3",
  "mdimgup.bucket": "my-space",
  "mdimgup.accessKey": "DO00EXAMPLE",
  "mdimgup.secretKey": "secret_key_here",
  "mdimgup.cdnDomain": "https://my-space.nyc3.cdn.digitaloceanspaces.com"
}
```

### 7.3 Copilot Instructions Update

Update `.github/copilot-instructions.md`:
- Add section on multi-provider support design
- Document configuration resolution logic
- Add examples for each provider
- Update "Settings and safety" section
- Add testing instructions for multiple providers

---

## 8. Implementation Plan

### 8.1 Phase 1: Core Refactoring (Week 1)
- [ ] Add new settings to `package.json` (non-breaking)
- [ ] Implement `resolveStorageConfig()` function
- [ ] Implement `createS3Client()` function
- [ ] Update error messages to be provider-aware
- [ ] Write unit tests for configuration resolution

### 8.2 Phase 2: Integration & Testing (Week 2)
- [ ] Test with Cloudflare R2 (legacy and new config)
- [ ] Test with AWS S3 (multiple regions)
- [ ] Test with MinIO (local instance)
- [ ] Test with DigitalOcean Spaces
- [ ] Verify backward compatibility

### 8.3 Phase 3: Documentation (Week 2)
- [ ] Update `README.md` with multi-provider examples
- [ ] Create migration guide
- [ ] Update `.github/copilot-instructions.md`
- [ ] Update extension description in `package.json`
- [ ] Update command title and messages

### 8.4 Phase 4: Release (Week 3)
- [ ] Update `CHANGELOG.md`
- [ ] Bump version to 0.1.0
- [ ] Create GitHub release
- [ ] Publish to VS Code Marketplace
- [ ] Monitor for issues and feedback

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing R2 configurations | High | Low | Extensive backward compatibility testing |
| S3 SDK compatibility issues | Medium | Low | Use well-tested `@aws-sdk/client-s3` v3 |
| Endpoint URL format variations | Medium | Medium | Validate and document expected formats |
| Region handling differences | Medium | Medium | Provide clear examples per provider |

### 9.2 User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Confusion between legacy and new settings | Medium | Medium | Clear migration guide and examples |
| Complex configuration for new users | Low | Medium | Provide templates in documentation |
| Unclear error messages | Medium | Low | Provider-specific error messages |

### 9.3 Maintenance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Increased testing burden | Medium | High | Automate provider testing where possible |
| Documentation drift | Low | Medium | Keep examples in sync with code |
| New S3-compatible services | Low | Medium | Use generic `s3-compatible` option |

---

## 10. Success Metrics

### 10.1 Adoption Metrics
- Number of users configuring non-R2 providers (tracked via telemetry opt-in)
- Reduction in "R2-only" support requests
- GitHub stars/downloads increase

### 10.2 Quality Metrics
- Zero breaking changes for existing R2 users
- 90%+ test coverage for configuration resolution
- <5 provider-specific bug reports per month

### 10.3 Usability Metrics
- Average time to configure new provider: <5 minutes
- Documentation clarity (user feedback)
- Error message helpfulness (user feedback)

---

## 11. Future Enhancements (Out of Scope)

### 11.1 Advanced Features
- [ ] Multi-bucket support (per-folder routing)
- [ ] Azure Blob Storage support
- [ ] Google Cloud Storage support
- [ ] Environment variable credential support
- [ ] Credential manager integration
- [ ] Custom upload key template (user-defined pattern)

### 11.2 UI Enhancements
- [ ] Settings UI wizard for provider setup
- [ ] Provider auto-detection from endpoint
- [ ] Inline validation errors in settings
- [ ] Upload progress bar per image

### 11.3 Performance Optimizations
- [ ] Parallel hash computation (worker threads)
- [ ] Persistent cache (cross-session)
- [ ] Upload queue with retry logic
- [ ] Multipart upload for large images

---

## 12. Open Questions

1. **Setting Names**: Should we keep `mdimgup.` prefix or rename to `imageUpload.` for clarity?
2. **Deprecation Timeline**: When should `r2*` settings be fully removed?
3. **Default Provider**: Should default be `cloudflare-r2` or `s3-compatible`?
4. **Telemetry**: Should we track provider usage (opt-in)?
5. **Region Auto-Detection**: Should we attempt to detect AWS region from endpoint URL?

---

## 13. Approval & Sign-Off

**Stakeholders:**
- [ ] Extension Maintainer (leonwong282)
- [ ] Early Adopter Users (beta testing)
- [ ] Technical Reviewer (AI Assistant)

**Approval Date:** _____________

**Next Steps:**
1. Review and provide feedback on this requirements document
2. Clarify open questions
3. Approve implementation plan
4. Begin Phase 1 implementation

---

## Appendix A: Current vs. Proposed Configuration

### Current (R2-Only)
```typescript
// src/extension.ts (lines 18-27)
const R2_ACCOUNT_ID = cfg.get<string>("r2AccountId");
const R2_BUCKET = cfg.get<string>("r2Bucket");
const R2_ACCESS_KEY = cfg.get<string>("r2AccessKey");
const R2_SECRET_KEY = cfg.get<string>("r2SecretKey");
const R2_DOMAIN = cfg.get<string>("r2Domain");

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_DOMAIN) {
  vscode.window.showErrorMessage("R2 config missing — fill settings first.");
  return;
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY }
});
```

### Proposed (Multi-Provider)
```typescript
// src/extension.ts (refactored)
const storageConfig = resolveStorageConfig(cfg);

if (!storageConfig) {
  vscode.window.showErrorMessage(
    "Storage configuration missing. Please configure your storage provider settings."
  );
  return;
}

const s3 = createS3Client(storageConfig);

// ... rest of upload logic remains unchanged
```

---

## Appendix B: Provider Comparison Table

| Feature | Cloudflare R2 | AWS S3 | MinIO | DigitalOcean Spaces | Backblaze B2 |
|---------|---------------|--------|-------|---------------------|--------------|
| **S3 API Compatibility** | ✅ Full | ✅ Native | ✅ Full | ✅ Full | ✅ Full |
| **Custom Endpoint** | Yes (account-based) | No (regional) | Yes | Yes | Yes |
| **Region Concept** | `auto` | Required | Optional | Required | Optional |
| **Account ID Required** | Yes | No | No | No | No |
| **Public CDN** | R2 custom domain | CloudFront/S3 URL | Configurable | Spaces CDN | B2 CDN |
| **Path-Style Access** | Yes | Yes | Yes | Yes | Yes |
| **Virtual-Hosted Style** | No | Yes | Yes | Yes | No |

---

**END OF REQUIREMENTS DOCUMENT**
