# mdimgup v0.2.0 Release Notes

## 🎉 Major Release: Multi-Profile Support

Released: [DATE]

---

## ✨ What's New

### Multi-Profile System
Manage multiple storage configurations with ease! v0.2.0 introduces a complete profile management system that allows you to:

- **Save unlimited profiles** for different storage providers
- **Quick switch** between profiles with `Ctrl+Alt+P` / `Cmd+Alt+P`
- **Workspace-specific profiles** that auto-activate based on your current project
- **Status bar integration** showing your active profile at a glance

### Secure Credential Storage
All credentials are now stored securely using VS Code's Secret Storage API:
- 🔐 Stored in your system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- 🚫 Never stored in plaintext settings
- 🔒 Protected by your OS security layer

### Import/Export Profiles
Share profile templates with your team:
- 📤 Export profiles as JSON (credentials excluded)
- 📥 Import pre-configured templates
- 🤝 Standardize team configurations

### Seamless Migration
Existing users are automatically guided through migration:
- ✅ One-click migration from legacy single-config
- 🔄 100% backward compatible
- 📋 Legacy settings still supported (deprecated)

---

## 🚀 New Commands (11 Total)

| Command | Keybinding | Description |
|---------|-----------|-------------|
| `Create Storage Profile` | - | Launch interactive wizard to create new profile |
| `Select Active Profile` | - | Choose from all saved profiles |
| `Quick Switch Profile` | `Ctrl+Alt+P` / `Cmd+Alt+P` | Fast profile switcher |
| `Edit Storage Profile` | - | Modify existing profile |
| `Delete Storage Profile` | - | Remove profile (with confirmation) |
| `Duplicate Storage Profile` | - | Clone profile as template |
| `List All Profiles` | - | View all profiles with details |
| `Import Profile` | - | Import from JSON file |
| `Export Profile` | - | Export to JSON (credentials excluded) |
| `Upload Images with Profile Selection` | - | Upload with temporary profile override |
| `Upload Markdown Images to Cloud Storage` | - | Upload with active profile |

---

## ⚙️ New Settings (3)

```jsonc
{
  // ID of the currently active storage profile
  "mdimgup.activeProfile": "",
  
  // Show active profile name in status bar
  "mdimgup.showProfileInStatusBar": true,
  
  // Prompt to migrate legacy configuration to profiles
  "mdimgup.promptMigration": true
}
```

---

## 🔄 Breaking Changes

**⚠️ v0.0.1 R2-Only Settings Removed**

The original v0.0.1 R2-specific settings are **no longer supported**:
- ❌ `mdimgup.r2AccountId`
- ❌ `mdimgup.r2Bucket`
- ❌ `mdimgup.r2AccessKey`
- ❌ `mdimgup.r2SecretKey`
- ❌ `mdimgup.r2Domain`

**Migration:** Use `Mdimgup: Create Storage Profile` to create a new profile with your credentials.

**✅ v0.1.0 Settings Still Supported**

Generic settings from v0.1.0 continue to work:
- ✅ `mdimgup.storageProvider`
- ✅ `mdimgup.bucket`
- ✅ `mdimgup.accessKey`
- ✅ `mdimgup.secretKey`
- ✅ `mdimgup.accountId`
- ✅ `mdimgup.endpoint`
- ✅ `mdimgup.region`
- ✅ `mdimgup.cdnDomain`
- ✅ `mdimgup.pathPrefix`

These will be automatically migrated to profiles on first use.

---

## 🛠️ Technical Improvements

### Architecture
- **ProfileManager Service**: Centralized CRUD operations
- **Profile UI Module**: Interactive wizards and Quick Pick interfaces
- **Status Bar Module**: Visual feedback system
- **UUID v4 Profile IDs**: Collision-resistant identifiers

### Dependencies Added
- `uuid` ^11.0.3 - Profile ID generation
- `@types/uuid` ^10.0.0 - TypeScript definitions

### Code Quality
- TypeScript strict mode compilation
- ESLint clean (no warnings)
- Comprehensive error handling
- Backward compatibility layer

---

## 📖 Documentation Updates

### README.md
- Professional template structure with badges
- Multi-profile quick start guide
- Provider-specific setup wizards
- Detailed migration guide (3 user scenarios)
- Configuration reference tables
- Advanced features section
- Comprehensive troubleshooting

### CHANGELOG.md
- v0.2.0 release notes
- Feature breakdown
- Migration instructions

### New Files
- `REQUIREMENTS-MULTI-PROFILE.md` - Complete requirements document
- `RELEASE-NOTES-0.2.0.md` - This document

---

## 🐛 Bug Fixes

- None (new feature release)

---

## 📦 Package Details

- **Version**: 0.2.0
- **Size**: 8.99MB
- **Files**: 1965 files
- **Min VS Code**: 1.105.0+
- **Package**: `mdimgup-0.2.0.vsix`

---

## 🎯 Usage Example

### Before v0.2.0 (Single Config)
```jsonc
// settings.json - only one configuration possible
{
  "mdimgup.storageProvider": "cloudflare-r2",
  "mdimgup.bucket": "my-bucket",
  "mdimgup.accessKey": "***",
  "mdimgup.secretKey": "***"
}
```

### After v0.2.0 (Multi-Profile)
```bash
# Create profiles for different projects
1. Command Palette → "Mdimgup: Create Storage Profile"
2. Name: "Personal Blog (R2)"
3. Provider: Cloudflare R2
4. Enter credentials securely

# Repeat for work projects
1. Name: "Work Docs (AWS S3)"
2. Provider: AWS S3
3. Region: us-east-1

# Quick switch with Ctrl+Alt+P
Status Bar: ☁️ Personal Blog (R2) ↓
```

---

## 🚦 Migration Paths

### Scenario 1: v0.0.1 R2-Only Settings User (BREAKING)
```jsonc
// Old v0.0.1 settings.json (NO LONGER SUPPORTED)
{
  "mdimgup.r2AccountId": "abc123",
  "mdimgup.r2Bucket": "my-bucket",
  "mdimgup.r2AccessKey": "...",
  "mdimgup.r2SecretKey": "...",
  "mdimgup.r2Domain": "https://cdn.example.com"
}
```
**Action**: Must create new profile manually → `Mdimgup: Create Storage Profile`

### Scenario 2: v0.1.0 Generic Settings User (SUPPORTED)
```jsonc
// Old settings.json
{
  "mdimgup.storageProvider": "aws-s3",
  "mdimgup.bucket": "my-bucket"
}
```
**Action**: Continue working as-is OR migrate to profiles for multi-config

### Scenario 3: New User
**Action**: Launch "Mdimgup: Create Storage Profile" wizard → guided setup

---

## 🔮 What's Next?

Planned for future releases:
- [ ] Profile templates (pre-configured for popular providers)
- [ ] Batch operations (multiple Markdown files)
- [ ] Image optimization (WebP conversion)
- [ ] Custom naming patterns
- [ ] Upload history with undo
- [ ] Azure Blob Storage native support
- [ ] Google Cloud Storage native support

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas for contribution:**
- Profile template library
- Provider-specific optimizations
- Testing on different platforms
- Documentation improvements

---

## 🙏 Acknowledgments

Special thanks to:
- Early adopters who requested multi-profile support
- VS Code extension community for API guidance
- Contributors who provided feedback during development

---

## 📞 Support

- 📝 [Report an issue](https://github.com/leonwong282/mdimgup/issues/new)
- 💬 [Start a discussion](https://github.com/leonwong282/mdimgup/discussions)
- 📧 Email: leonwong282@gmail.com

---

## 🎬 Getting Started

1. **Install**: Search "mdimgup" in VS Code Extensions
2. **Create Profile**: `Cmd+Shift+P` → "Mdimgup: Create Storage Profile"
3. **Upload**: Right-click in Markdown → "Upload Markdown Images to Cloud Storage"
4. **Switch**: `Ctrl+Alt+P` → Select profile

---

**⭐ If this release helped you, please star the repository!**

[GitHub](https://github.com/leonwong282/mdimgup) | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=leonwong282.mdimgup) | [Changelog](CHANGELOG.md)
