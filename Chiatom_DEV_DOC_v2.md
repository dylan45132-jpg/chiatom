# Chiatom — 開發文件 v2

> 以 A4 頁面為單位的區塊式講義編輯器。
> 核心理念：你編輯的就是你印出來的。
> 定位：桌面應用，初期自用，目標開源。

名稱由 Chi（χ，希臘字母，同時呼應 Human-Computer Interaction 的核心縮寫）與 Diatom（矽藻）組合而成。
矽藻是自然界中結構最精密的單細胞生物，每一個體都是獨立、完整、幾何精確的矽質外殼——內容裝進去，就是一件完整的東西。
這與 Chiatom 的核心設計哲學完全一致：每一頁都是獨立的一等公民，主題是容器，內容是你填進去的。
與姊妹專案 Chiraph（諧音長頸鹿，學術寫作中繼站）同屬 Chi 系列工具，共享命名語言，服務不同的創作情境。

---

### 目錄

1. [產品定位](#1-產品定位)
2. [目標使用者](#2-目標使用者)
3. [核心工作流](#3-核心工作流)
4. [市場定位](#4-市場定位)
5. [產品邊界](#5-產品邊界)
6. [資料模型](#6-資料模型)
7. [區塊系統](#7-區塊系統)
8. [主題系統](#8-主題系統)
9. [匯出策略](#9-匯出策略)
10. [UI 設計方向](#10-ui-設計方向)
11. [功能優先級](#11-功能優先級)
12. [技術選型](#12-技術選型)
13. [系統架構](#13-系統架構)
14. [開發環境](#14-開發環境)
15. [開發進度](#15-開發進度)

---

### 1. 產品定位

現有工具都沒有解決一個真實問題：**LLM 可以生出精美的 HTML 講義排版，但沒有工具讓你直接在那個排版裡填內容。**

- Typora 是最好的 Markdown 編輯器，但無法控制內容出現在頁面的哪個位置
- Notion 是最好的區塊編輯器，但頁面感是假的，列印結果不可預測
- Word 太重，且無法套用自訂 HTML 排版
- 手動維護 HTML + 每次丟給 LLM 重整，流程摩擦極高

Handout Editor 的定位：

> **一個以 A4 頁面為單位的區塊式講義編輯器。頁面是一等公民，所見即所得不只是樣式，而是位置。**

---

### 2. 目標使用者

**主要：** 老師、講師、課程設計者，需要定期製作有固定視覺風格的講義或教材。

**共同特徵：**
- 熟悉或願意使用 LLM 協助排版設計
- 需要精確控制內容在頁面的位置（跟 Notion 的飄動式不同）
- 最終輸出為 PDF 或可印刷 HTML
- 不想每次改內容都要重新整理 HTML 結構

**開源後的潛在用戶：**
- 懂 CSS 的設計師，想做自己的主題包分享給社群
- 任何需要製作固定版面文件（報告、提案、手冊）的人

---

### 3. 核心工作流

**情境：製作一份新講義**

```
用 LLM 設計好主題包（theme.css + theme.json）
        ↓
Handout Editor 匯入主題，編輯器套上該主題的樣式
        ↓
左側面板新增頁面，右側出現空白 A4
        ↓
打 / 叫出區塊選單，插入 h1、段落、表格、複合區塊…
        ↓
直接在頁面上打字，看到的就是最終講義的樣子
        ↓
自動儲存為 .json（保留編輯狀態）
        ↓
按匯出 → 輸出單一自給自足的 HTML 檔案
        ↓
瀏覽器列印 → PDF
```

---

### 4. 市場定位

| 工具 | 定位 | 缺什麼 |
|---|---|---|
| Typora | 最佳 Markdown 編輯體驗 | 無法控制頁面 layout，無區塊概念 |
| Notion | 區塊式筆記 | 頁面感是假的，列印不可預測，鎖在雲端 |
| Word | 全功能文字處理 | 無法套用自訂 HTML 主題，太重 |
| Google Slides | 簡報製作 | 不是連續文件，不適合講義 |
| InDesign | 專業排版 | 學習成本極高，不適合一般老師 |
| 手動 HTML | 完全自由 | 每次改內容要重整 HTML，流程摩擦高 |

**Handout Editor 的差異化：唯一以 A4 頁面為單位、支援自訂主題、輸出乾淨 HTML 的區塊式編輯器。**

---

### 5. 產品邊界

**做：**
- 頁面管理（新增、刪除、複製、拖曳排序）
- 基本區塊（h1–h3、p、ul、ol、blockquote、table、hr、image placeholder）
- 複合區塊（由主題定義，編輯器動態讀取）
- `/` 指令選單 + 行尾 `+` 按鈕插入區塊
- 區塊拖曳排序
- 主題系統（匯入 theme.css + theme.json，即時套用）
- 自動儲存為 JSON
- 匯出單一 HTML 檔案（CSS inline）
- 瀏覽器列印 / PDF

**不做（現階段）：**
- 雲端同步、協作
- 版本控制、歷史記錄
- 直接匯入 Markdown 或 docx
- 內建 LLM 功能
- 行動版

---

### 6. 資料模型

整份文件在記憶體和存檔裡的結構：

```typescript
// 整份文件
interface Document {
  id: string
  title: string
  theme: ThemeConfig
  pages: Page[]
  createdAt: string
  updatedAt: string
}

// 頁面（一等公民）
interface Page {
  id: string
  title: string          // 左側面板顯示用，不出現在講義
  content: TiptapJSON    // 這一頁的區塊內容，完全交給 Tiptap 管理
}

// 主題設定（存在 Document 裡，記錄用了哪個主題）
interface ThemeConfig {
  name: string
  cssPath: string        // 本地路徑或 inline CSS
  json: ThemeDefinition
}
```

**核心原則：**
- 頁面層由我們管，頁面內的區塊層由 Tiptap 管
- 每個 Page 是一個獨立的 Tiptap editor 實例
- 切換頁面 = 切換 Tiptap 實例，頁面之間完全隔離
- JSON 是 Single Source of Truth，HTML 是純輸出物

#### 儲存格式：.handout 打包檔

為了支援圖片資產，工作檔採用打包格式，副檔名 `.handout`（本質是 zip）：

```
lecture-01.handout  （zip 結構）
├── document.json      # 文件資料，圖片用相對路徑引用
└── assets/
    ├── img-001.png
    └── img-002.jpg
```

- JSON 內的圖片路徑存相對路徑（`assets/img-001.png`）
- Tauri 開檔時解壓到暫存目錄，透過 asset protocol 存取圖片
- 匯出 HTML 時圖片轉 Base64 inline，輸出物完全自給自足
- **禁止**把圖片 Base64 塞進 `document.json`（效能問題）

✅ 已實作（Phase 2）
- 圖片以二進位存入 assets/，JSON 存相對路徑
- 開檔時解壓到 %TEMP%/chiatom/{docId}/
- 編輯器用 convertFileSrc() 顯示暫存圖片
- 存檔時把 base64 dataUrl 轉回二進位打包進 zip

#### 頁面溢出行為（Overflow Policy）

這個工具的心智模型是「頁面設計」，不是「文字流動」，因此**不做自動跨頁流動**。

溢出處理規則：
- 頁面高度固定為 A4（297mm），區塊往下疊加
- 當頁面內容高度超過 A4 時，頁面底部出現紅色警示線 + 提示文字「內容超出 A4 範圍」
- 使用者可以：刪減內容、或把後面的區塊移到下一頁
- 區塊右鍵選單提供「移至下一頁」快捷操作
- 這個設計誠實告知使用者狀態，不假裝自動處理，符合「所見即所得」的承諾

---

### 7. 區塊系統

區塊分兩層，責任分離：

#### 基本區塊（編輯器原生定義）

| 區塊 | Tiptap Node | 說明 |
|---|---|---|
| 大標題 | `heading` level 1 | h1 |
| 中標題 | `heading` level 2 | h2 |
| 小標題 | `heading` level 3 | h3 |
| 段落 | `paragraph` | 預設區塊 |
| 無序清單 | `bulletList` | ul |
| 有序清單 | `orderedList` | ol |
| 引用 | `blockquote` | blockquote |
| 表格 | `table` | 獨立面板設定欄列數 |
| 分隔線 | `horizontalRule` | hr |
| 圖片佔位 | `imagePlaceholder` | 自訂 node，點擊上傳 |

#### 複合區塊（主題定義）

複合區塊本質是「幾個基本區塊 + wrapper div + CSS class」，由 `theme.json` 宣告：

```json
{
  "blocks": [
    {
      "name": "重點摘要",
      "key": "summary-box",
      "icon": "📋",
      "class": "block-summary-box",
      "children": [
        { "type": "label", "placeholder": "標籤文字" },
        { "type": "ol", "placeholder": "條列重點..." }
      ]
    },
    {
      "name": "核心目標",
      "key": "objective",
      "icon": "🎯",
      "class": "block-objective",
      "children": [
        { "type": "label", "placeholder": "目標說明" },
        { "type": "ol", "placeholder": "目標條列..." }
      ]
    }
  ]
}
```

編輯器讀到 `theme.json` 後：
- `/` 選單自動出現這些複合區塊選項
- 插入時生成對應的 HTML wrapper 結構
- 樣式完全由 `theme.css` 的對應 class 決定

換主題 → 可用的複合區塊也跟著換，基本區塊永遠存在。

#### 複合區塊 Fallback 機制

**內容永遠不能消失**，即使換了不支援某複合區塊的主題。

當 renderer 遇到在目前主題的 `theme.json` 中找不到對應定義的複合區塊時：

```typescript
compound: (node) => {
  const def = theme.blocks.find(b => b.key === node.attrs.key)
  if (!def) {
    // 降級：保留所有子內容，標記為未知區塊
    return `<div class="block-unknown-fallback"
                 data-original-key="${node.attrs.key}">
              ${renderChildren(node)}
            </div>`
  }
  return `<div class="${def.class}">${renderChildren(node)}</div>`
}
```

編輯器介面同步處理：
- 該區塊顯示黃色警示邊框 + 提示「此區塊在目前主題無對應樣式」
- 內容仍可正常編輯
- 切換回支援該區塊的主題後，樣式自動恢復

---

### 8. 主題系統

#### 主題包結構

```
my-theme/
├── theme.css     # 所有樣式，包含基本區塊和複合區塊
└── theme.json    # 主題 metadata + 複合區塊宣告
```

`theme.json` 完整結構：

```json
{
  "name": "抹茶講義",
  "version": "1.0.0",
  "author": "",
  "description": "和紙質感，抹茶色系",
  "pageSize": "A4",
  "blocks": []
}
```

#### 匯入方式

三種方式，同時支援：

1. **上傳資料夾**：選取整個主題資料夾，自動讀取 `theme.css` + `theme.json`
2. **貼上 CSS**：直接貼 CSS 文字，無複合區塊，適合快速測試
3. **內建主題**：預設提供 1–2 套主題，讓新用戶開箱即用

#### 主題與編輯器 UI 的邊界

- 編輯器 UI（toolbar、左側面板、區塊操作把手）永遠使用編輯器自己的 design tokens，不受主題影響
- 主題 CSS 的作用域限制在 `.page` 容器內，不能影響編輯器 chrome
- 技術上用 CSS scope 或 shadow DOM 隔離

---

### 9. 匯出策略

#### 即時預覽

編輯時 Tiptap 本身就是 WYSIWYG，主題 CSS 同時載入進編輯器，所見即最終樣子，不需要額外的預覽模式。

#### Renderer

匯出時，renderer 把每頁的 Tiptap JSON 轉成套上主題 class 的 HTML：

```typescript
// renderer 是一個 node type → HTML 的 mapping
const renderers: Record<string, Renderer> = {
  heading: (node) =>
    `<h${node.attrs.level}>${renderChildren(node)}</h${node.attrs.level}>`,
  paragraph: (node) =>
    `<p>${renderChildren(node)}</p>`,
  blockquote: (node) =>
    `<blockquote>${renderChildren(node)}</blockquote>`,
  compound: (node) => {
    const def = theme.blocks.find(b => b.key === node.attrs.key)
    return `<div class="${def.class}">${renderChildren(node)}</div>`
  },
  // ...
}
```

#### 匯出 HTML 結構

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>講義標題</title>
  <style>
    /* theme.css 完整 inline，無外部依賴 */
  </style>
</head>
<body>
  <div class="page"><!-- 第一頁 --></div>
  <div class="page"><!-- 第二頁 --></div>
  <!-- ... -->
</body>
</html>
```

輸出是完全自給自足的單一 HTML 檔案，任何瀏覽器打開樣式一致，列印 / 另存 PDF 直接透過瀏覽器。

#### 列印輸出策略

**Phase 1–3：CSS 嚴格定義列印樣式**

主題 CSS 必須包含完整的 `@media print` 規則：

```css
@media print {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  break-inside: avoid;  /* 複合區塊、表格不被腰斬 */
}
```

UI 提示用戶列印設定：「建議使用 Chrome，關閉頁首頁尾，勾選背景圖形」。

**Phase 4（開源前）：引入 Paged.js**

Paged.js 是純前端 library，接管瀏覽器列印流程，提供精確的分頁控制、頁碼、邊距設定，才能真正兌現「所見即所得」的承諾。不需要 sidecar，技術成本低於 Puppeteer。

---

### 10. UI 設計方向

#### 整體佈局

```
┌─────────────────────────────────────────────────────┐
│  Toolbar：標題、主題選擇、匯出、設定                   │
├──────────────┬──────────────────────────────────────┤
│  左側面板    │  內容區                               │
│              │                                      │
│  頁面列表    │  ┌─────────────────────────┐         │
│  可拖曳排序  │  │   A4 頁面（主題樣式）    │         │
│              │  │                         │         │
│  + 新增頁面  │  │   區塊 1                │         │
│              │  │   區塊 2                │         │
│              │  │   ...                   │         │
│              │  └─────────────────────────┘         │
│              │  ┌─────────────────────────┐         │
│              │  │   第二頁                │         │
│              │  └─────────────────────────┘         │
└──────────────┴──────────────────────────────────────┘
```

#### Design Tokens

```css
/* 編輯器 UI 專用，與主題 CSS 完全分離 */
--ui-bg-base:        #0f0f0f;
--ui-bg-surface:     #1a1a1a;
--ui-bg-elevated:    #242424;
--ui-border:         rgba(255,255,255,0.08);
--ui-border-strong:  rgba(255,255,255,0.14);
--ui-text-primary:   rgba(255,255,255,0.88);
--ui-text-secondary: rgba(255,255,255,0.45);
--ui-text-tertiary:  rgba(255,255,255,0.25);
--ui-accent:         #a8c5a0;   /* 低飽和綠，品牌色 */
--ui-accent-hover:   #bcd4b5;
--ui-danger:         #e07070;
--ui-radius-sm:      3px;
--ui-radius-md:      6px;
--ui-radius-lg:      10px;
--ui-spacing-xs:     4px;
--ui-spacing-sm:     8px;
--ui-spacing-md:     14px;
--ui-spacing-lg:     24px;
```

#### 區塊操作

- 每個區塊 hover 時左側出現拖曳把手（`⠿`）
- 拖曳把手旁有 `+` 按鈕，點擊插入新區塊於下方
- 在空白區塊打 `/` 叫出選單
- 選單分組：基本區塊 / 主題複合區塊（若有）
- 選取區塊時上方出現浮動工具列（轉換類型、刪除）

#### 左側面板

- 每個頁面顯示縮略名稱（取自該頁第一個 h1，若無則顯示「頁面 N」）
- 拖曳排序用 dnd-kit（跟 Chiraph 同一套）
- 右鍵選單：複製頁面、刪除頁面、在前後插入

#### Toast 通知

- 右下角，成功（綠）/ 失敗（紅）/ 提示（灰）
- 3 秒自動消失
- 全站統一使用，不用 alert()

---

### 11. 功能優先級

#### Phase 1 — MVP（可用的最小版本）

- [ ] 基本頁面管理（新增、刪除、切換）
- [ ] 基本區塊：h1–h3、p、ul、ol、blockquote、hr
- [ ] `/` 指令選單（基本區塊）
- [ ] 行尾 `+` 按鈕
- [ ] 區塊拖曳排序
- [ ] 主題匯入（貼上 CSS）
- [ ] 自動儲存 JSON
- [ ] 匯出 HTML（CSS inline）
- [ ] 頁面溢出警示（紅線 + 提示文字）

#### Phase 2 — 完整編輯體驗

- [ ] 表格區塊（獨立設定面板：欄列數）
- [ ] 圖片佔位區塊
- [ ] 複合區塊支援（讀取 theme.json）
- [ ] 複合區塊 Fallback 機制（未知區塊黃色警示 + 內容保留）
- [ ] 主題上傳（資料夾匯入）
- [ ] 儲存格式升級為 .handout 打包檔（含 assets/）
- [ ] 左側面板拖曳排序
- [ ] 頁面縮略名稱自動更新
- [ ] 頁面右鍵選單（含「移至下一頁」）
- [ ] 複製頁面

#### Phase 3 — 打磨

- [ ] 內建 1–2 套預設主題
- [ ] 區塊浮動工具列（轉換類型）
- [ ] 快捷鍵（Markdown 語法觸發：`## ` → h2）
- [ ] 列印樣式優化（@media print，break-inside: avoid）
- [ ] 方程式支援（KaTeX，`$...$` inline、`$$...$$` block）
- [ ] 空狀態引導（第一次開啟的 onboarding）

#### Phase 4 — 開源準備

- [ ] Paged.js 整合（精確列印分頁控制）
- [ ] 英文 README
- [ ] 主題製作文件
- [ ] macOS 公證
- [ ] Windows installer

---

### 12. 技術選型

| 層級 | 選擇 | 理由 |
|---|---|---|
| 桌面框架 | Tauri v2 | 可直接讀寫本地 JSON / CSS 檔案；與 Chiraph 同一套，熟悉 |
| 前端 | React + TypeScript | 同上 |
| 編輯器引擎 | Tiptap 3 | （原寫 Tiptap 2，實際裝到 3.x）專為區塊式編輯器設計；/ 指令、drag handle 有現成 extension；資料模型是 JSON，直接序列化存檔 |
| 頁面拖曳 | dnd-kit | 與 Chiraph 同一套 |
| 樣式 | CSS Modules + design tokens | 編輯器 UI 與主題 CSS 嚴格隔離 |
| 存檔 | Tauri fs plugin + JSZip | 讀寫 .handout 打包檔 |
| 打包 | Vite | 同 Chiraph |

#### Tiptap Extensions 規劃

```
@tiptap/starter-kit           // 基本區塊全家桶
@tiptap/extension-table       // 表格（子路徑 import：/table /row /cell /header）
@tiptap/extension-typography  // 智慧引號等排版細節
@tiptap/extension-placeholder // 空區塊提示文字
@tiptap/suggestion            // Slash Command 機制
@tiptap/core                  // 自訂 Extension 基底
// 自訂 extension：
//   SlashCommand      → / 指令選單（純 DOM，動態複合區塊）
//   CompoundBlock     → 複合區塊 node（ReactNodeViewRenderer）
//   ImagePlaceholder  → 圖片佔位（ReactNodeViewRenderer）
//   MathInline        → $...$ KaTeX inline（Phase 3）
//   MathBlock         → $$...$$ KaTeX block（Phase 3）
```

#### 其他關鍵套件

```
jszip              // .handout 打包檔讀寫（Phase 2 ✅）
prosemirror-state  // Slash Command PluginKey
katex              // 方程式渲染（Phase 3）
paged.js           // 精確列印分頁控制（Phase 4）
```

#### 技術筆記
- Tiptap 3.x BubbleMenu 已從 @tiptap/react 移除，改為自製 selectionUpdate 監聽
- @tiptap/extension-table 需走子路徑 import（/table /row /cell /header）
- Tauri asset protocol 需在 tauri.conf.json 設 assetProtocol.enable + scope
- fs:allow-create-dir 不存在，正確為 fs:allow-mkdir
- Zustand 5.x 使用具名 import：import { create } from 'zustand'
- Tiptap StarterKit 3.x：history 改名為 undoRedo

---

### 13. 系統架構

#### 前端模組結構

```
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── Toolbar.tsx
│   ├── Sidebar.tsx            # 頁面列表，dnd-kit 排序
│   ├── Canvas.tsx             # 頁面渲染區，上下排列所有 Page
│   ├── PageEditor.tsx         # 單一頁面，包含一個 Tiptap 實例
│   ├── BlockMenu.tsx          # / 指令選單
│   ├── TableModal.tsx         # 表格設定面板
│   ├── ThemeImporter.tsx      # 主題匯入
│   └── Toast.tsx
├── editor/
│   ├── extensions/
│   │   ├── SlashCommand.ts
│   │   ├── CompoundBlock.ts
│   │   ├── ImagePlaceholder.ts
│   │   ├── MathInline.ts       # Phase 3
│   │   └── MathBlock.ts        # Phase 3
│   └── renderer.ts             # Tiptap JSON → HTML
├── store/
│   └── documentStore.ts        # Zustand，管理 Document 狀態
├── theme/
│   ├── themeLoader.ts          # 讀取 theme.css + theme.json
│   └── defaultTheme.ts         # 內建預設主題
├── utils/
│   ├── autosave.ts
│   └── handoutPackage.ts       # .handout zip 打包/解包（Phase 2）
└── styles/
    ├── tokens.css              # 編輯器 UI design tokens
    ├── base.css
    └── editor.css
```

#### 資料流

```
用戶操作
    ↓
Tiptap（區塊層）
    ↓ onUpdate
documentStore（頁面層）
    ↓ autosave
.json 檔案（Tauri fs）

匯出時：
documentStore → renderer → HTML string → 寫檔
```

---

### 14. 開發環境

與 Chiraph 完全相同的技術棧：

| 工具 | 版本 |
|---|---|
| Tauri CLI    | 2.x     |
| React        | 19.1.0  |
| TypeScript   | 5.8.3   |
| Vite         | 7.x     |
| Node.js      | 24.x    |
| pnpm         | 10.33.2 |

#### 主要前端套件

```
@tiptap/react                 3.23.1
@tiptap/starter-kit           3.23.1
@tiptap/extension-table       3.23.1
@tiptap/extension-typography  3.23.1
@tiptap/extension-placeholder 3.23.1
@tiptap/suggestion            （已裝）
@tiptap/core                  （已裝）
@dnd-kit/core                 6.3.1
@dnd-kit/sortable             10.0.0
@dnd-kit/utilities            （已補裝）
zustand                       5.0.13
jszip                         3.10.1
prosemirror-state             （已裝）
katex                         // Phase 3
paged.js                      // Phase 4
```

---

### 15. 開發進度

#### Phase 1 — MVP ✅ 完成

完成項目：
- 專案建立（Tauri v2 + React 19 + TypeScript + Vite 7）
- Design tokens + CSS 骨架（tokens.css / base.css / editor.css）
- documentStore（Zustand 5，頁面增刪、排序、內容更新、載入文件）
- toastStore（通知系統，success / error / info）
- Toolbar（標題編輯、儲存、開啟、匯出 HTML）
- Sidebar（頁面列表、新增、刪除、dnd-kit 拖曳排序）
- Canvas + PageEditor（A4 頁面 + Tiptap 3 編輯器）
- 自動儲存 JSON（dialog 選擇路徑）
- 匯出 HTML（renderer.ts，CSS inline，可直接列印）
- Toast 通知（右下角，3 秒消失）
- 頁面溢出警示（ResizeObserver 監測，紅線 + 提示文字）

#### Phase 2 — 完整編輯體驗 ✅ 完成

完成項目：
- 表格區塊（@tiptap/extension-table，子路徑 import）
- 圖片佔位區塊（自訂 NodeView + Tauri readFile + base64 → zip）
- .handout 打包格式（JSZip + convertFileSrc + asset protocol）
- 複合區塊（自訂 NodeView，動態讀取 theme.json.blocks，Fallback 黃色警示）
- 複合區塊 Fallback 機制（換主題後內容保留，黃色警示邊框）
- 主題匯入（資料夾匯入 theme.css + theme.json，貼上 CSS）
- Slash Command（/ 指令選單，@tiptap/suggestion，純 DOM 選單，動態複合區塊）
- 浮動工具列（文字格式 + 表格操作，自製 selectionUpdate 監聽，無第三方）
- 頁面右鍵選單（插入、複製、刪除，純 React + position:fixed）
- 儲存/開啟格式升級為 .handout
- 匯出 HTML 支援所有區塊（表格、圖片、複合區塊）

技術筆記：
- Tiptap 3.x BubbleMenu 已從 @tiptap/react 移除，改為自製 selectionUpdate 監聽
- @tiptap/extension-table 子路徑 import（/table /row /cell /header）
- Tauri asset protocol 需在 tauri.conf.json 設 assetProtocol.enable + scope
- fs:allow-create-dir 不存在，正確為 fs:allow-mkdir

#### Phase 3 — 打磨 ✅ 完成

完成項目：
- 快捷鍵（Markdown 語法觸發）：確認 StarterKit 3.x 內建，無需額外實作
- 方程式支援（KaTeX）：@tiptap/extension-mathematics 官方 extension，支援 inline / block，點擊彈出 Modal 編輯（即時預覽 + 常用語法片段），匯出 HTML 自動帶入 KaTeX CDN
- 內建預設主題：三套主題（Slate / Washi / Moss），ThemeImporter 新增「內建主題」頁籤
- 列印樣式優化：@media print 隱藏編輯器 UI，每頁對應 A4
- 空狀態引導：啟動時不建立預設頁面，顯示三步驟引導畫面

額外修復：
- 圖片匯出空白 bug（Phase 2 遺留）：匯出 HTML 時將 Tauri asset URL 解析為真實路徑並轉 base64 inline

技術筆記：
- @tiptap/extension-mathematics onClick 需透過 inlineOptions / blockOptions 設定
- KaTeX CSS 匯出用 CDN link，字型 fallback 可接受（講義列印情境）
- Mathematics.configure 的 onClick 閉包可直接捕獲 useEditor 回傳的 editor 實例

#### Phase 4 — 開源準備 ⬜

---

━━━━━━━━━━━━━━━━━━━━━━
【設計系統規則】（Handout Editor 專用）
━━━━━━━━━━━━━━━━━━━━━━

產品性質：面向老師、講師、課程設計者的講義製作工具。使用者在「創作」，不在「修改」。
參考基準：Typora、Linear、iA Writer 的克制感。編輯器是透明的，講義內容是主角。
不要生成 marketing-style block sections；優先像真實桌面產品，而不是展示頁。

【總體目標】
產出低裝飾、高辨識度、可長期迭代的產品介面。
編輯器 UI 要退到背景，讓講義內容成為視覺焦點。
視覺語言克制、安靜、專業，避免模板感、SaaS landing page 感、AI 生成感。

【核心設計原則】
- 編輯器 UI（chrome）和講義內容區（canvas）有明確的視覺邊界，兩者不互相污染
- 每個畫面只能有一個主視覺焦點或主要任務
- 優先用排版、間距、分組、對齊建立美感，不依賴裝飾
- 所有元件都要能承受真實資料：長標題、空狀態、錯誤、零資料

【禁止出現的 AI 味特徵】
- 禁止紫色、藍紫色、霓虹色漸層作為預設主視覺
- 禁止發光背景、玻璃擬態、漂浮光球、模糊 blob、過度炫光
- 禁止「三欄等寬 feature cards」的典型 SaaS 模板
- 禁止 icon 放在彩色圓形底內當裝飾語言
- 禁止所有區塊都置中排版；除 hero 或極短標語外，內容預設左對齊
- 禁止過多陰影、大圓角、過度飽和色塊
- 禁止用 emoji 當設計元素
- 禁止 generic hero copy、空泛 slogan、模板化產品文案

【色彩規則】
- 編輯器 UI 使用深色中性色系（見 design tokens）
- 主題色只出現在 .page 容器內，不出現在編輯器 chrome
- 一個畫面內非中性色控制在 1–2 種
- 色彩必須有角色分工：品牌色（低飽和綠）、互動色、成功、警告、錯誤

【排版規則】
- 字級層級控制在少數幾種，字重對比、行高、段落節奏優先
- 預設左對齊
- 標題必須具體，避免抽象口號
- 內文短、準、像真實產品，不是廣告文案

【版面規則】
- 先用穩定網格與一致間距，再加入少量變化
- 卡片不是預設解法；若不用卡片更清楚，就不要硬塞卡片
- 不要用裝飾補空白；若畫面空，先檢查資訊架構與內容密度

【元件規則】
- 所有元件來自同一套 design tokens（見第 10 節）
- 狀態齊全：default, hover, active, focus, disabled, loading, empty, error
- 互動元素清楚但不花俏，focus 可見，hover 克制
- 邊框與陰影要極輕

【輸出順序】
每次產 UI 前：
1. 一句話說明此畫面的主要任務
2. 列出資訊層級與視線流
3. 定義此畫面的 layout 原則與 design tokens
4. 產出 UI
5. 自我檢查是否有 AI 味，主動修正

【自我審查清單】
- 主角是否明確？（講義內容，不是編輯器 UI）
- 編輯器 chrome 是否夠退？
- 閱讀順序是否一眼可辨？
- 是否出現 AI 模板痕跡？
- 是否用了過多漸層、陰影、圓角、圖示裝飾？
- 是否太像行銷頁而不像真實產品？
- 是否能承受真實資料與極端狀態？
- 刪掉一些裝飾後是否更好？

---

*最後更新：2026-05-10*
*狀態：Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ → Phase 4 待開始*
*v2 更新：溢出行為設計、.handout 打包格式、複合區塊 Fallback 機制、列印策略（CSS + Paged.js 規劃）、方程式支援（Phase 3 KaTeX）*

Chiatom 開發交接文件
當前狀態

Phase 1 ✅、Phase 2 ✅ 全部完成
下一步：Phase 3

工作流規則

我：分析、診斷、設計、寫 Gemini CLI 指令
Gemini CLI（VS Code PowerShell）：讀檔、改檔
你：傳遞資訊、決策
電腦：Windows PowerShell（VS Code）
PowerShell 不支援 &&，要分兩行跑

專案位置

專案：C:\chiatom
Chiraph 參考：C:\Users\dylan\chiraph
測試主題：C:\chiatom\test-theme

技術棧

Tauri v2 + React 19 + TypeScript + Vite 7
Tiptap 3.23.1（注意：不是文件寫的 2.x）
Zustand 5.x（具名 import）
dnd-kit 6.x / 10.x
JSZip 3.10.1

重要踩坑記錄

Tiptap 3.x BubbleMenu 已從 @tiptap/react 移除，我們改用自製 selectionUpdate 監聽
@tiptap/extension-table 需走子路徑 import（/table /row /cell /header）
Tauri asset protocol 需在 tauri.conf.json 設 assetProtocol.enable + scope
fs:allow-create-dir 不存在，正確為 fs:allow-mkdir
Zustand 5.x：import { create } from 'zustand'（具名，非 default）
Tiptap StarterKit 3.x：history 改名為 undoRedo
PowerShell 不支援 &&，指令要分兩行
pnpm build 看錯誤：pnpm build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20

現有檔案結構
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── Toolbar.tsx          # 開啟、儲存、匯出HTML、主題按鈕
│   ├── Sidebar.tsx          # 頁面列表、dnd-kit排序、右鍵選單
│   ├── Canvas.tsx           # A4頁面渲染區、theme CSS注入
│   ├── PageEditor.tsx       # 單一頁面 Tiptap 實例
│   ├── BubbleToolbar.tsx    # 浮動工具列（文字格式+表格操作）
│   ├── EditorToolbar.tsx    # 已廢棄（空檔）
│   ├── PageContextMenu.tsx  # 頁面右鍵選單
│   ├── ThemeImporter.tsx    # 主題匯入 Modal
│   └── Toast.tsx            # 右下角通知
├── editor/
│   ├── extensions/
│   │   ├── SlashCommand.ts          # / 指令選單（純DOM）
│   │   ├── CompoundBlock.ts         # 複合區塊 Node
│   │   ├── CompoundBlockView.tsx    # 複合區塊 NodeView
│   │   ├── ImagePlaceholder.ts      # 圖片佔位 Node
│   │   └── ImagePlaceholderView.tsx # 圖片佔位 NodeView
│   └── renderer.ts          # Tiptap JSON → HTML（匯出用）
├── store/
│   ├── documentStore.ts     # Zustand，Document狀態
│   └── toastStore.ts        # Toast通知狀態
├── theme/
│   ├── themeLoader.ts       # 讀取 theme.css + theme.json
│   └── defaultTheme.ts      # 內建預設主題（目前空）
├── utils/
│   ├── autosave.ts          # 已被 handoutPackage 取代（可清理）
│   ├── handoutPackage.ts    # .handout zip 打包/解包
│   └── tauriImage.ts        # 圖片選取+base64轉換
└── styles/
    ├── tokens.css           # 編輯器 UI design tokens
    ├── base.css             # Reset
    └── editor.css           # 所有元件樣式
關鍵設定檔

src-tauri/tauri.conf.json：asset protocol 已啟用，CSP 已設定
src-tauri/capabilities/default.json：fs、dialog 權限已開放
src-tauri/src/lib.rs：fs、dialog、store、opener plugins 已註冊

Phase 3 ✅ 全部完成

Phase 4 待完成清單：
- Paged.js（精確列印分頁控制）
- 英文 README
- 主題製作文件
- macOS 公證
- Windows installer

待處理：
- autosave.ts 可清理（已被 handoutPackage 取代）