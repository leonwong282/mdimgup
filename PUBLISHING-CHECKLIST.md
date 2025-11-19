# Quick Publishing Checklist

Use this checklist when you're ready to publish mdimgup to the VS Code Marketplace.

## ⚠️ Before You Start

1. **Set Your Publisher Name**
   - [ ] Create a publisher account: https://marketplace.visualstudio.com/manage
   - [ ] Update `package.json`: Replace `"YOUR-PUBLISHER-NAME"` with your actual publisher ID
   - [ ] Save the file

2. **Optional: Add Extension Icon**
   - [ ] Create a 128x128px PNG icon named `icon.png`
   - [ ] Place it in the root directory
   - [ ] Add `"icon": "icon.png"` to `package.json`

## 🚀 Publishing Steps

### 1. Create Azure DevOps Personal Access Token
- [ ] Go to https://dev.azure.com/
- [ ] Sign in with Microsoft account
- [ ] Profile picture → Personal access tokens → + New Token
- [ ] Name: `vscode-marketplace`
- [ ] Scopes: **Marketplace** → **Manage** ✓
- [ ] Copy token and save it securely

### 2. Install Publishing Tool
```bash
npm install -g @vscode/vsce
```

### 3. Login to Publisher Account
```bash
vsce login YOUR-PUBLISHER-NAME
# Paste your Personal Access Token when prompted
```

### 4. Test Package Locally
```bash
# Package the extension
vsce package

# Install locally to test
code --install-extension mdimgup-0.1.0.vsix

# Test with actual Markdown files and storage provider
# Then uninstall test version
```

### 5. Publish to Marketplace
```bash
vsce publish
```

Wait 5-10 minutes for the extension to appear in the marketplace.

### 6. Verify Publication
- [ ] Visit: https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER-NAME.mdimgup
- [ ] Search in VS Code Extensions view
- [ ] Install and test from marketplace

### 7. Post-Publishing Tasks
```bash
# Tag release on GitHub
git add .
git commit -m "chore: prepare for v0.1.0 release"
git push
git tag v0.1.0
git push origin v0.1.0
```

- [ ] Create GitHub Release: https://github.com/leonwong282/mdimgup/releases
- [ ] Add release notes from CHANGELOG.md
- [ ] Attach `.vsix` file (optional)

## 📚 Documentation Reference

For detailed step-by-step instructions, see: **[PUBLISHING.md](./PUBLISHING.md)**

## 🔄 Future Updates

When updating the extension:

```bash
# Update version in package.json
npm version patch  # 0.1.0 → 0.1.1

# Update CHANGELOG.md with changes

# Commit changes
git add .
git commit -m "chore: bump version to 0.1.1"
git push

# Publish update
vsce publish

# Tag release
git tag v0.1.1
git push origin v0.1.1
```

## ❓ Need Help?

- **Full guide:** See [PUBLISHING.md](./PUBLISHING.md)
- **VS Code docs:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace:** https://marketplace.visualstudio.com/manage
- **Issues:** https://github.com/leonwong282/mdimgup/issues

## ✅ Quick Verification

Before publishing, verify:
- [ ] Extension compiles: `npm run compile`
- [ ] No critical errors: `npm run lint`
- [ ] LICENSE file exists
- [ ] Publisher name set in package.json
- [ ] All dependencies installed: `npm install`
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md is up to date
