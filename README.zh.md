[English](README.md) | 繁體中文
# Chiatom

以 A4 頁面為單位的區塊式講義編輯器。你編輯的就是你印出來的。

---

## 這是什麼

Chiatom 是一個桌面應用，專為需要定期製作講義的老師和講師設計。

現有工具都沒有解決一個真實問題：**LLM 可以生出精美的 HTML 講義排版，但沒有工具讓你直接在那個排版裡填內容。**

- Typora 是最好的 Markdown 編輯器，但無法控制內容出現在頁面的哪個位置
- Notion 的頁面感是假的，列印結果不可預測
- Word 無法套用自訂 HTML 排版

Chiatom 的做法：頁面是一等公民。你在 A4 頁面上直接編輯，看到的就是最終印出來的樣子。

---

## 功能

- **A4 頁面編輯**：每個頁面固定 A4 尺寸，所見即所得
- **區塊系統**：標題、段落、清單、表格、引用、圖片、方程式（KaTeX）
- **主題系統**：匯入自訂主題包（theme.css + theme.json），或使用內建三套主題
- **複合區塊**：由主題定義的自訂區塊，透過 `/` 指令插入
- **方程式支援**：inline 和 block LaTeX，即時預覽
- **匯出 HTML**：單一自給自足的 HTML 檔案，圖片 base64 inline，可直接瀏覽器列印為 PDF
- **`.handout` 格式**：含圖片資產的打包存檔格式

---

## 安裝

> **安裝檔即將推出。** 目前請從原始碼建置。

### 系統需求

- Node.js 24.x
- pnpm 10.x
- Rust（Tauri 建置需要）

### 從原始碼建置

```bash
# clone 專案
git clone https://github.com/your-username/chiatom.git
cd chiatom

# 安裝相依套件
pnpm install

# 開發模式啟動
pnpm tauri dev

# 建置正式版本
pnpm tauri build
```

建置完成後，安裝檔位於 `src-tauri/target/release/bundle/`。

---

## 快速開始

1. 啟動應用，看到引導畫面
2. 點擊右上角「主題」，選擇一套內建主題（Slate / Washi / Moss）
3. 點擊左側面板的「＋」新增第一個頁面
4. 在頁面上直接打字，或按 `/` 插入區塊
5. 完成後點擊「匯出 HTML」，用瀏覽器開啟後列印為 PDF

詳細的使用手冊請參考 [docs/zh/使用手冊.md](docs/zh/使用手冊.md)。
---

## 主題

Chiatom 的視覺風格完全由主題控制。主題包含兩個檔案：

```
my-theme/
├── theme.css    # 頁面樣式
└── theme.json   # 主題資訊與複合區塊定義
```

匯入方式：點擊右上角「主題」→「資料夾匯入」，選取主題資料夾。

詳細的主題製作方式請參考 [docs/zh/主題製作指南.md](docs/zh/主題製作指南.md)。

---

## 技術棧

| 層級 | 選擇 |
|---|---|
| 桌面框架 | Tauri v2 |
| 前端 | React 19 + TypeScript + Vite 7 |
| 編輯器引擎 | Tiptap 3.23.x |
| 狀態管理 | Zustand 5.x |
| 存檔格式 | JSZip（.handout） |

---

## 專案狀態

- Phase 1 MVP ✅
- Phase 2 完整編輯體驗 ✅
- Phase 3 打磨 ✅
- Phase 4 開源準備 ⬜

---

## 授權

Chiatom 以 [GNU General Public License v3.0](LICENSE) 授權開源。

主題包（theme.css + theme.json）以 MIT 授權獨立發布，
社群可以自由製作、分享和販售主題，不受 GPL 限制。
詳見 [chiatom-themes](https://github.com/your-username/chiatom-themes)。

---

