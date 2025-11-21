<a id="readme-top"></a>

<div align="center">

<a href="https://github.com/leonwong282/mdimgup">
  <img src="images/logo.png" alt="Logo" width="80" height="80">
</a>

# 📦 mdimgup

> VS Code Markdown 圖片上傳工具 - 支援任何 S3 相容的雲端儲存

![Version](https://img.shields.io/badge/Version-0.2.1-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![VS Code](https://img.shields.io/badge/VS%20Code-1.105.0+-purple?style=for-the-badge)

[🌍 English](README.md) | [🇹🇼 繁體中文](README.zh-TW.md)

[功能特色](#-功能特色) • [快速開始](#-快速開始) • [多設定檔支援](#-多設定檔支援) • [支援的服務商](#-支援的服務商) • [遷移指南](#-遷移指南)

</div>

---

## 📸 概述

`mdimgup` 是一個強大的 VS Code 擴充套件，可自動將 Markdown 檔案中引用的本地圖片上傳到 S3 相容的雲端儲存（Cloudflare R2、AWS S3、MinIO、DigitalOcean Spaces、Backblaze B2 等），然後即時更新圖片連結。

**✨ v0.2.1 新功能：** 多設定檔支援、自訂命名模式和上傳歷史記錄（含復原功能）！管理多個儲存配置、控制檔案名稱格式，並一鍵還原上傳。

## ✨ 功能特色

- 🎯 **多設定檔管理**：儲存並在多個儲存配置間切換
- ☁️ **通用 S3 支援**：支援 Cloudflare R2、AWS S3、MinIO、DigitalOcean Spaces、Backblaze B2 及任何 S3 相容服務
- 🎨 **自訂命名模式**：使用變數（時間戳記、日期、雜湊、設定檔、計數器等）的檔案名稱範本
- 📜 **上傳歷史與復原**：追蹤已上傳的圖片，並可透過單一指令還原（可選擇從 S3 刪除）
- 🖼️ **智慧圖片處理**：上傳前自動調整大小（GIF 除外）
- ⚡ **快速並行上傳**：可配置的並發數量，實現快速批次上傳
- 🔐 **安全的憑證儲存**：儲存在 VS Code 的安全金鑰鏈中（Secret Storage）
- 📊 **狀態列整合**：隨時查看您的活動設定檔
- 🎨 **工作區感知**：根據工作區自動選擇設定檔
- 💾 **工作階段快取**：避免在同一工作階段中重複上傳
- 🔄 **匯入/匯出**：與團隊分享設定檔範本
- ⌨️ **快速切換**：使用 `Ctrl+Alt+P` / `Cmd+Alt+P` 切換設定檔

## 🛠️ 技術堆疊

- **儲存**：S3 相容 API（AWS SDK v3）
- **圖片處理**：Sharp（調整大小、最佳化）
- **安全性**：VS Code Secret Storage API（安全金鑰鏈）
- **快取**：基於 MD5 的記憶體內去重
- **使用者介面**：VS Code Quick Pick、狀態列、命令選擇區

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🚀 快速開始

### 前置需求

開始之前，請確保您擁有：

- **VS Code**（v1.105.0 或更高版本）
- **S3 相容的儲存帳號**（請參閱[支援的服務商](#-支援的服務商)）
- **儲存桶憑證**：存取金鑰 ID 和秘密存取金鑰
- **CDN 網域**：您的儲存桶的公開 URL（或儲存桶 URL）

### 安裝

1. **從 VS Code 市集安裝**
   ```
   ext install mdimgup
   ```
   或在擴充功能檢視（`Ctrl+Shift+X`）中搜尋 "mdimgup"

2. **建立您的第一個設定檔**
   - 開啟命令選擇區（`Ctrl+Shift+P` / `Cmd+Shift+P`）
   - 執行：`Mdimgup: Create Storage Profile`
   - 按照精靈配置您的儲存

3. **開始上傳**
   - 開啟 Markdown 檔案
   - 右鍵點選 → **Upload Markdown Images to Cloud Storage**
   - 觀看您的本地圖片轉換為 CDN URL！

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🎯 多設定檔支援

**v0.2.1 新功能！** 輕鬆管理多個儲存配置。

### 為什麼需要多設定檔？

- 🏢 **分離環境**：開發、測試和生產環境的不同儲存桶
- 👥 **多個客戶**：自由工作者管理不同客戶專案
- 🌐 **多個部落格**：每個部落格/專案使用不同的儲存
- 🔬 **測試**：本地 MinIO 用於開發，雲端儲存用於生產

### 快速設定檔管理

#### 建立設定檔
```
Ctrl+Shift+P → "Mdimgup: Create Storage Profile"
```
- 互動式精靈引導您完成設定
- 憑證安全地儲存在 VS Code 金鑰鏈中
- 設定檔特定的設定（最大寬度、並行數等）

#### 切換設定檔
```
Ctrl+Alt+P  (Windows/Linux)
Cmd+Alt+P   (macOS)
```
或點選狀態列中的設定檔名稱。

#### 工作區特定設定檔
為每個工作區設定預設設定檔：

```
Ctrl+Shift+P → "Mdimgup: Select Active Profile" → 勾選「設為工作區預設」
```

### 設定檔管理指令

| 指令 | 說明 |
|------|------|
| **Create Storage Profile** | 啟動設定檔建立精靈 |
| **Select Active Profile** | 選擇活動設定檔 |
| **Quick Switch Profile** | 快速設定檔切換器（`Ctrl+Alt+P`）|
| **Upload with Profile Selection** | 一次性上傳到特定設定檔 |
| **Edit Storage Profile** | 修改現有設定檔 |
| **Delete Storage Profile** | 刪除設定檔 |
| **Duplicate Storage Profile** | 複製設定檔（不含憑證）|
| **List All Profiles** | 檢視所有已配置的設定檔 |
| **Import Profile** | 從 JSON 檔案匯入 |
| **Export Profile** | 匯出到 JSON 檔案（不含憑證）|

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## ☁️ 支援的服務商

- ✅ **Cloudflare R2** - 零出口費用，非常適合部落格
- ✅ **AWS S3** - 業界標準物件儲存
- ✅ **MinIO** - 自架、開源替代方案
- ✅ **DigitalOcean Spaces** - 簡單且內建 CDN
- ✅ **Backblaze B2** - 經濟實惠、S3 相容
- ✅ **任何 S3 相容服務** - 提供通用模式

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🔄 遷移指南

### 從 v0.1.0 升級到 v0.2.1

**好消息！** 您現有的配置會繼續運作。無需立即採取行動。

**自動遷移**

首次使用 v0.2.1 時，擴充套件將：
1. 偵測您現有的 v0.1.0 配置（通用設定）
2. 提供將其轉換為命名設定檔
3. 保留您的舊版設定作為備援（為了安全）

**手動遷移（建議）**

**步驟 1：您目前的設定仍然有效**
```json
// 您的 v0.1.0 settings.json（仍然支援）
{
  "mdimgup.storageProvider": "cloudflare-r2",
  "mdimgup.accountId": "abc123",
  "mdimgup.bucket": "my-blog",
  "mdimgup.accessKey": "...",
  "mdimgup.secretKey": "...",
  "mdimgup.cdnDomain": "https://cdn.example.com"
}
```

**步驟 2：建立設定檔（可選但建議）**
1. 開啟命令選擇區（`Ctrl+Shift+P`）
2. 執行：`Mdimgup: Create Storage Profile`
3. 使用精靈（如果可能，設定將預先填入）

**步驟 3：清理（可選）**
確認設定檔運作後：
1. 開啟 settings.json
2. 移除舊設定
3. 僅保留與設定檔相關的設定

#### ⚠️ 重大變更：已移除 v0.0.1 的 R2 專用設定

如果您仍在使用**原始 v0.0.1 的 R2 專用設定**，這些**不再受支援**：

```json
// ❌ 已在 v0.2.1 中移除（v0.0.1 設定）
{
  "mdimgup.r2AccountId": "...",
  "mdimgup.r2Bucket": "...",
  "mdimgup.r2AccessKey": "...",
  "mdimgup.r2SecretKey": "...",
  "mdimgup.r2Domain": "..."
}
```

**遷移路徑：** 使用 `Mdimgup: Create Storage Profile` 建立新設定檔並輸入您的 R2 憑證。

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## ⚙️ 配置參考

### 設定檔設定

設定檔儲存所有配置和憑證。透過以下方式存取：
- 設定檔建立精靈（推薦）
- 或手動在 `globalState` 中（進階）

### 全域設定

| 設定 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `mdimgup.activeProfile` | string | `""` | 目前活動設定檔的 ID |
| `mdimgup.showProfileInStatusBar` | boolean | `true` | 在狀態列顯示設定檔名稱 |
| `mdimgup.promptMigration` | boolean | `true` | 提示遷移舊版配置 |
| `mdimgup.maxWidth` | number | `1280` | 預設最大圖片寬度（可按設定檔覆寫）|
| `mdimgup.parallelUploads` | number | `5` | 預設並發上傳數（可按設定檔覆寫）|
| `mdimgup.useCache` | boolean | `true` | 預設快取行為（可按設定檔覆寫）|

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 📝 使用方法

### 基本工作流程

1. **開啟包含本地圖片的 Markdown 檔案**：
   ```markdown
   ![截圖](./images/screenshot.png)
   ![示意圖](../assets/diagram.jpg)
   ```

2. **上傳圖片**：
   - **方法 1**：右鍵點選 → **Upload Markdown Images to Cloud Storage**
   - **方法 2**：命令選擇區 → **Upload Markdown Images to Cloud Storage**
   - **方法 3**：右鍵點選 → **Upload Images with Profile Selection**（先選擇設定檔）

3. **觀看魔法** ✨：
   - 擴充套件調整圖片大小（如有需要）
   - 上傳到您的活動設定檔的儲存
   - 即時更新連結

### 狀態列

狀態列顯示您的活動設定檔：
- **📦 生產部落格** - 點選以切換設定檔
- **📦 無設定檔** - 點選以建立或選擇設定檔

### 鍵盤快速鍵

| 快速鍵 | 動作 |
|--------|------|
| `Ctrl+Alt+P` / `Cmd+Alt+P` | 快速切換設定檔 |

### 💡 專業技巧：使用剪貼簿管理工具處理憑證

建立或編輯設定檔時，您需要輸入存取金鑰和秘密金鑰。由於當您切換視窗（複製憑證）時 VS Code 的命令選擇區會關閉，我們建議使用**剪貼簿管理工具**來簡化此流程：

**建議的工作流程：**
1. **在**執行設定檔建立**之前**：從服務商的儀表板複製您的存取金鑰和秘密金鑰
2. **在**設定檔建立**期間**：使用剪貼簿管理工具快速鍵貼上憑證
3. **熱門的剪貼簿管理工具：**
   - **macOS**：Raycast（免費）、Alfred、Paste、Maccy
   - **Windows**：Ditto、ClipClip、Windows 11 剪貼簿歷史記錄（`Win+V`）
   - **Linux**：CopyQ、Clipman、Parcellite

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🎯 自訂命名模式

**v0.2.1 新功能！** 使用自訂命名模式控制上傳的檔案名稱格式。

### 模式變數

在您的命名模式中使用這些變數：

| 變數 | 說明 | 輸出範例 |
|------|------|----------|
| `{timestamp}` | Unix 時間戳記（毫秒）| `1700000000000` |
| `{date}` | 日期（YYYY-MM-DD）| `2024-03-15` |
| `{time}` | 時間（HH-mm-ss）| `14-30-45` |
| `{datetime}` | 日期和時間 | `2024-03-15_14-30-45` |
| `{filename}` | 原始檔案名稱（不含副檔名）| `screenshot` |
| `{ext}` | 副檔名（含點）| `.png` |
| `{hash:N}` | 檔案雜湊的前 N 個字元 | `{hash:8}` → `a1b2c3d4` |
| `{profile}` | 活動設定檔名稱 | `production-blog` |
| `{counter}` | 自動遞增計數器 | `001`、`002`、`003` |
| `{random:N}` | N 個隨機字元 | `{random:6}` → `x7k9m2` |

### 預定義範本

```
1. {timestamp}-{filename}{ext}          → 預設模式，確保唯一性
2. {date}/{filename}{ext}               → 日期組織的資料夾
3. {profile}/{datetime}-{filename}{ext} → 設定檔特定帶時間戳記
4. {date}/{hash:8}-{filename}{ext}      → 日期 + 內容雜湊
5. {filename}-{random:6}{ext}           → 保留原始名稱加隨機後綴
6. images/{counter:03d}-{filename}{ext} → 順序編號
```

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 📜 上傳歷史與復原

**v0.2.1 新功能！** 追蹤所有已上傳的圖片，並使用單一指令復原錯誤。

### 指令

| 指令 | 說明 |
|------|------|
| **View Upload History** | 瀏覽最近的上傳並執行動作 |
| **Undo Last Upload** | 還原目前文件中的最後一次上傳 |
| **Clear Upload History** | 刪除歷史記錄（保留 S3 檔案）|

### 主要功能

- ⏪ **復原上傳**：一鍵還原，可選擇從 S3 刪除
- 📊 **追蹤使用情況**：查看所有已上傳的圖片和中繼資料
- 🔍 **尋找圖片**：按文件、設定檔或日期瀏覽
- 🗄️ **自動管理**：儲存最多 1,000 筆記錄，自動清理

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🔮 藍圖

- [x] 多服務商支援
- [x] 多設定檔管理
- [x] 安全憑證儲存
- [x] 自訂命名模式
- [x] 上傳歷史與復原
- [ ] 批次操作
- [ ] 圖片最佳化（WebP 轉換）
- [ ] Azure Blob Storage 支援
- [ ] Google Cloud Storage 支援

查看[開放議題](https://github.com/leonwong282/mdimgup/issues)以獲取更多資訊。

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 📜 發行說明

### 0.2.1（最新）

**主要功能：**
- 🎉 多設定檔系統
- 🎨 自訂命名模式
- 📜 上傳歷史與復原
- 🔐 安全憑證儲存
- 📊 狀態列整合
- ⌨️ 快速切換

查看 [CHANGELOG.md](CHANGELOG.md) 以獲取完整詳細資訊。

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🤝 貢獻

我們歡迎貢獻！查看 [CONTRIBUTING.md](CONTRIBUTING.md) 以獲取詳細指南。

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 📄 授權條款

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 👥 作者

- **Leon Wong** - *初始開發* - [leonwong282](https://github.com/leonwong282)

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 🙏 致謝

- **[VS Code Extension API](https://code.visualstudio.com/api)** - 平台基礎
- **[AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3)** - S3 客戶端
- **[Sharp](https://sharp.pixelplumbing.com/)** - 圖片處理
- **Cloudflare R2** - 零出口費用
- **開源社群** - 持續的支援

---

**⭐ 如果這個儲存庫對您有幫助，請給它一個星星！**

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

## 📞 支援

- 📝 [開啟議題](https://github.com/leonwong282/mdimgup/issues/new)
- 💬 [開始討論](https://github.com/leonwong282/mdimgup/discussions)
- 📧 電子郵件：leonwong282@gmail.com
- 🌐 部落格：[leonwong282.com](https://leonwong282.com/)

<p align="right">(<a href="#readme-top">回到頂部</a>)</p>

---

<div align="center">

**用 ❤️ 製作，作者 [Leon](https://github.com/leonwong282)**

</div>
