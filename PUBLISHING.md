# Publishing Guide: mdimgup VS Code Extension

This guide walks you through publishing your extension to the Visual Studio Code Marketplace.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Publishing Checklist](#pre-publishing-checklist)
3. [Step 1: Add Missing Required Files](#step-1-add-missing-required-files)
4. [Step 2: Create Publisher Account](#step-2-create-publisher-account)
5. [Step 3: Install Publishing Tools](#step-3-install-publishing-tools)
6. [Step 4: Package Your Extension](#step-4-package-your-extension)
7. [Step 5: Test the Packaged Extension](#step-5-test-the-packaged-extension)
8. [Step 6: Publish to Marketplace](#step-6-publish-to-marketplace)
9. [Step 7: Verify Publication](#step-7-verify-publication)
10. [Post-Publishing Tasks](#post-publishing-tasks)
11. [Future Updates](#future-updates)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before publishing, ensure you have:

- ✅ A GitHub account (your repository: https://github.com/leonwong282/mdimgup)
- ✅ Node.js and npm installed
- ✅ Your extension code is committed to GitHub
- ⚠️ A Microsoft account (needed for Azure DevOps)
- ⚠️ A publisher account on Visual Studio Marketplace (we'll create this)

---

## Pre-Publishing Checklist

Before publishing, verify these items:

### Code Quality
- [ ] Extension compiles without errors: `npm run compile`
- [ ] No critical lint errors: `npm run lint`
- [ ] Extension functionality tested in Extension Development Host (F5)
- [ ] All settings documented in README.md

### Required Files
- [ ] `LICENSE` file (required by marketplace)
- [ ] Extension icon (recommended, 128x128px PNG)
- [ ] `README.md` with clear description and screenshots
- [ ] `CHANGELOG.md` documenting version history

### package.json Metadata
- [ ] `publisher` field added
- [ ] `license` field added
- [ ] `icon` field added (if you have an icon)
- [ ] `keywords` for discoverability
- [ ] `categories` appropriate for your extension
- [ ] `repository` URL correct
- [ ] `bugs` URL added (optional but recommended)

---

## Step 1: Add Missing Required Files

### 1.1: Add LICENSE File

A license is **required** by the VS Code Marketplace.

**Create `LICENSE` file:**

```bash
# Choose a license (MIT is most common for VS Code extensions)
# For MIT License:
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 leonwong282

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

### 1.2: Add Extension Icon (Optional but Recommended)

Create a 128x128px PNG icon for your extension. Place it in the root directory as `icon.png`.

**Quick icon creation options:**
- Use Canva, Figma, or similar tools
- Use an AI image generator
- Find free icons on IconFinder, Flaticon (check licenses)
- Keep it simple and recognizable

**Example icon ideas for mdimgup:**
- Cloud with upward arrow
- Markdown logo + cloud
- Image icon + upload symbol

### 1.3: Update package.json with Publishing Metadata

Add the following fields to your `package.json`:

```json
{
  "publisher": "your-publisher-name",
  "license": "MIT",
  "icon": "icon.png",
  "keywords": [
    "markdown",
    "image",
    "upload",
    "cloudflare",
    "r2",
    "s3",
    "aws",
    "minio",
    "storage",
    "cloud"
  ],
  "categories": [
    "Other"
  ],
  "bugs": {
    "url": "https://github.com/leonwong282/mdimgup/issues"
  },
  "homepage": "https://github.com/leonwong282/mdimgup#readme"
}
```

**Note:** Replace `"your-publisher-name"` with your actual publisher name (we'll create this in Step 2).

### 1.4: Update Categories

Consider using more specific categories:

```json
"categories": [
  "Other",
  "Formatters"
]
```

Available categories: Programming Languages, Snippets, Linters, Themes, Debuggers, Formatters, Keymaps, SCM Providers, Other, Extension Packs, Language Packs, Data Science, Machine Learning, Visualization, Notebooks, Education, Testing.

---

## Step 2: Create Publisher Account

### 2.1: Sign Up for Azure DevOps

1. Go to https://dev.azure.com/
2. Sign in with your Microsoft account (or create one)
3. Create an organization if prompted (can be your name or company name)

### 2.2: Create Personal Access Token (PAT)

1. In Azure DevOps, click your profile picture (top right) → **Personal access tokens**
2. Click **+ New Token**
3. Configure:
   - **Name:** `vscode-marketplace` (or any descriptive name)
   - **Organization:** Select your organization
   - **Expiration:** 90 days or custom (longer is more convenient)
   - **Scopes:** Click "Show all scopes" → Select **Marketplace** → Check **Manage**
4. Click **Create**
5. **IMPORTANT:** Copy the token immediately and save it securely (you won't see it again)

### 2.3: Create Publisher on Visual Studio Marketplace

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with the same Microsoft account
3. Click **+ Create publisher**
4. Fill in:
   - **Publisher name (ID):** This will be part of your extension ID (e.g., `leonwong282`)
     - Must be unique
     - Can only contain alphanumeric characters, hyphens, and underscores
     - Cannot be changed later
   - **Display name:** Human-readable name (can be changed later)
   - **Email:** Your contact email (visible to users)
5. Click **Create**

**Save your publisher ID** — you'll need it in `package.json`.

---

## Step 3: Install Publishing Tools

### 3.1: Install vsce (Visual Studio Code Extensions CLI)

```bash
npm install -g @vscode/vsce
```

Verify installation:

```bash
vsce --version
```

### 3.2: Login to Publisher Account

```bash
vsce login <your-publisher-name>
```

When prompted, paste your Personal Access Token (PAT) from Step 2.2.

**Example:**
```bash
vsce login leonwong282
# Personal Access Token: <paste your token>
```

---

## Step 4: Package Your Extension

### 4.1: Update package.json with Publisher

Edit `package.json` and add your publisher name:

```json
{
  "publisher": "leonwong282",
  ...
}
```

### 4.2: Ensure Dependencies Are Production-Ready

Check that runtime dependencies are in `dependencies` (not `devDependencies`):

```bash
npm install --save @aws-sdk/client-s3 sharp p-limit crypto-js mime-types
```

**Note:** Your `package.json` is missing `@aws-sdk/client-s3`, `sharp`, and `p-limit` in dependencies! Add them:

```json
"dependencies": {
  "@aws-sdk/client-s3": "^3.0.0",
  "crypto-js": "^4.2.0",
  "mime-types": "^3.0.1",
  "p-limit": "^5.0.0",
  "sharp": "^0.33.0"
}
```

Then run:

```bash
npm install
```

### 4.3: Build Production Version

```bash
npm run compile
```

### 4.4: Package the Extension

```bash
vsce package
```

This creates a `.vsix` file (e.g., `mdimgup-0.1.0.vsix`).

**Common warnings you might see (usually safe to ignore):**
- Missing repository URL → You have one, so this won't appear
- Missing LICENSE → Fixed in Step 1
- No icon → Optional but recommended
- Large extension size → Sharp library is large (expected)

**If packaging fails:** Check the error message and fix issues in `package.json` or code.

---

## Step 5: Test the Packaged Extension

### 5.1: Install Locally

Test the `.vsix` file before publishing:

```bash
code --install-extension mdimgup-0.1.0.vsix
```

Or install via VS Code UI:
1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Click `...` (More Actions) → **Install from VSIX...**
4. Select your `.vsix` file

### 5.2: Test Functionality

1. Open a Markdown file with local images
2. Right-click → "Upload Markdown Images to Cloud Storage"
3. Configure settings for one of the supported providers
4. Verify upload works correctly

### 5.3: Uninstall Test Version

After testing:
1. Extensions view → Find "Markdown Image Upload"
2. Click gear icon → **Uninstall**

---

## Step 6: Publish to Marketplace

### 6.1: Publish Command

```bash
vsce publish
```

**Or publish with version bump:**

```bash
# Patch version (0.1.0 → 0.1.1)
vsce publish patch

# Minor version (0.1.0 → 0.2.0)
vsce publish minor

# Major version (0.1.0 → 1.0.0)
vsce publish major
```

### 6.2: What Happens

1. `vsce` validates your extension
2. Runs `vscode:prepublish` script (compiles TypeScript)
3. Packages the extension
4. Uploads to VS Code Marketplace
5. Extension goes through automated verification

**This process takes 5-10 minutes.**

---

## Step 7: Verify Publication

### 7.1: Check Marketplace Page

1. Go to: `https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>`
   - Example: `https://marketplace.visualstudio.com/items?itemName=leonwong282.mdimgup`
2. Verify:
   - ✅ Extension appears
   - ✅ README renders correctly
   - ✅ Icon displays (if added)
   - ✅ Installation instructions work

### 7.2: Install from Marketplace

In VS Code:
1. Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
2. Search for "Markdown Image Upload" or "mdimgup"
3. Click **Install**
4. Test functionality

### 7.3: Monitor Initial Reviews

- Check for user feedback
- Monitor GitHub issues
- Respond to questions promptly

---

## Post-Publishing Tasks

### 8.1: Tag Release on GitHub

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 8.2: Create GitHub Release

1. Go to https://github.com/leonwong282/mdimgup/releases
2. Click **Draft a new release**
3. Choose tag: `v0.1.0`
4. Release title: `v0.1.0 - Multi-Provider S3 Support`
5. Copy from `CHANGELOG.md`
6. Attach the `.vsix` file (optional)
7. Click **Publish release**

### 8.3: Update Repository README

Add marketplace badges to your GitHub README:

```markdown
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/leonwong282.mdimgup.svg)](https://marketplace.visualstudio.com/items?itemName=leonwong282.mdimgup)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/leonwong282.mdimgup.svg)](https://marketplace.visualstudio.com/items?itemName=leonwong282.mdimgup)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/leonwong282.mdimgup.svg)](https://marketplace.visualstudio.com/items?itemName=leonwong282.mdimgup)
```

### 8.4: Share Your Extension

- Post on Twitter/X, Reddit (r/vscode), LinkedIn
- Write a blog post about the extension
- Share in relevant developer communities

---

## Future Updates

### Updating Your Extension

When you have changes to publish:

#### 1. Update Version Number

Edit `package.json`:
```json
{
  "version": "0.1.1"
}
```

Or use npm:
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

#### 2. Update CHANGELOG.md

Document changes:
```markdown
## [0.1.1] - 2025-11-20

### Fixed
- Fixed issue with CDN URL construction
- Improved error messages

### Changed
- Updated dependencies
```

#### 3. Commit Changes

```bash
git add .
git commit -m "chore: bump version to 0.1.1"
git push
```

#### 4. Publish Update

```bash
vsce publish
```

Or with automatic version bump:
```bash
vsce publish patch
```

#### 5. Create GitHub Release

Tag and release the new version (see Step 8.2).

---

## Troubleshooting

### Error: "Missing publisher name"

**Solution:** Add `"publisher": "your-name"` to `package.json`.

### Error: "Missing LICENSE file"

**Solution:** Create a `LICENSE` file (see Step 1.1).

### Error: "Personal Access Token is invalid"

**Solutions:**
1. Check token hasn't expired in Azure DevOps
2. Verify token has **Marketplace: Manage** scope
3. Re-login: `vsce login <publisher-name>`

### Error: "Extension validation failed"

**Common causes:**
- Invalid `engines.vscode` version
- Missing required dependencies
- Syntax errors in `package.json`

**Solution:** Run `vsce package` to see detailed errors.

### Error: "Publisher not found"

**Solution:** Ensure you've created a publisher at https://marketplace.visualstudio.com/manage

### Extension Size Too Large

**Causes:** `sharp` library includes native binaries (~40MB).

**Solutions:**
1. Add unnecessary files to `.vscodeignore`
2. Consider lazy-loading `sharp` if possible
3. Document size in README

**Note:** 40MB is acceptable for VS Code extensions with image processing.

### Extension Not Appearing in Search

**Wait time:** New extensions can take 10-15 minutes to appear in search.

**Solutions:**
- Search by exact name or publisher
- Direct link always works immediately
- Check marketplace page directly

---

## Quick Reference Commands

```bash
# Install publishing tool
npm install -g @vscode/vsce

# Login to publisher
vsce login <publisher-name>

# Package extension (test)
vsce package

# Install locally for testing
code --install-extension mdimgup-0.1.0.vsix

# Publish to marketplace
vsce publish

# Publish with version bump
vsce publish patch   # 0.1.0 → 0.1.1
vsce publish minor   # 0.1.0 → 0.2.0
vsce publish major   # 0.1.0 → 1.0.0

# Update package.json version
npm version patch

# Create git tag
git tag v0.1.0
git push origin v0.1.0
```

---

## Additional Resources

- **VS Code Publishing Docs:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace Management:** https://marketplace.visualstudio.com/manage
- **Azure DevOps:** https://dev.azure.com/
- **Extension Guidelines:** https://code.visualstudio.com/api/references/extension-guidelines
- **vsce CLI Docs:** https://github.com/microsoft/vscode-vsce

---

## Summary Checklist

Before publishing:
- [ ] Added LICENSE file
- [ ] Created extension icon (optional)
- [ ] Updated package.json with publisher, license, keywords
- [ ] Added all runtime dependencies to package.json
- [ ] Created Azure DevOps Personal Access Token
- [ ] Created publisher on VS Code Marketplace
- [ ] Installed and logged in with vsce
- [ ] Tested extension locally
- [ ] Published to marketplace
- [ ] Created GitHub release
- [ ] Added marketplace badges to README

**You're ready to publish! 🚀**
