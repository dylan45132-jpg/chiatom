# Chiatom User Guide

---

## Table of Contents

1. [Interface Overview](#1-interface-overview)
2. [Document Management](#2-document-management)
3. [Page Management](#3-page-management)
4. [Block Operations](#4-block-operations)
5. [Theme System](#5-theme-system)
6. [Math Equations](#6-math-equations)
7. [Images](#7-images)
8. [Export and Print](#8-export-and-print)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Notes](#10-notes)

---

## 1. Interface Overview

```
┌─────────────────────────────────────────────────┐
│  Toolbar                                         │
├────────────┬────────────────────────────────────┤
│            │                                    │
│  Sidebar   │         Canvas                     │
│            │                                    │
│  Page list │    ┌─────────────────────┐         │
│            │    │                     │         │
│  [＋] Add  │    │   A4 Page           │         │
│            │    │                     │         │
│            │    └─────────────────────┘         │
│            │                                    │
└────────────┴────────────────────────────────────┘
```

**Toolbar**: Edit document title, open, save, export HTML, manage themes.

**Sidebar**: Page list with drag-to-reorder and right-click menu (insert, duplicate, delete).

**Canvas**: A4 pages rendered directly — what you see is what you get.

---

## 2. Document Management

### New document

When the app launches, you'll see an onboarding screen. Click "＋" in the sidebar to add your first page and start a new document.

### Save

Click "Save" in the toolbar. The first time, a dialog will ask where to save the file.

Files are saved in `.handout` format — a package containing document data and image assets.

> Subsequent saves overwrite the same file without a dialog. To save a copy elsewhere, close and reopen the app before saving again.

### Open

Click "Open" in the toolbar and select a `.handout` file.

### Document title

Click the title text in the toolbar to edit it. The title does not appear in the handout itself — it's only used for the filename and toolbar display.

---

## 3. Page Management

### Add a page

Click the "＋" button at the bottom of the sidebar to append a blank page.

### Switch pages

Click any page item in the sidebar to navigate to it.

### Reorder pages

Drag page items in the sidebar to change their order.

### Right-click menu

Right-click a page item in the sidebar to:
- **Insert page**: Add a new page after this one
- **Duplicate page**: Copy this page's content to a new page
- **Delete page**: Remove this page (at least one page must remain)

### Page title

The page title shown in the sidebar (e.g. "Page 1", "Page 2") does not appear in the handout — it's only for identification.

### Overflow warning

When page content exceeds the A4 height, a red warning line appears at the bottom with the message "Content exceeds A4 bounds."

This is not handled automatically. You'll need to trim content or move blocks to the next page manually.

---

## 4. Block Operations

### Insert a block

Press `/` anywhere on the page to open the block menu, then select a block type.

### Basic block types

| Block | Description |
|---|---|
| Heading 1 (h1) | Page main title |
| Heading 2 (h2) | Section title |
| Heading 3 (h3) | Subsection title |
| Paragraph | Regular text |
| Bullet list | Unordered list |
| Ordered list | Numbered list |
| Blockquote | Quoted text |
| Table | Custom rows and columns |
| Divider | Horizontal rule |
| Image | Image placeholder |
| Inline math | LaTeX inline equation |
| Block math | LaTeX block equation |

### Compound blocks

Custom blocks defined by the active theme, such as "Key Points" or "Core Objectives". Available compound blocks vary by theme and are inserted via the `/` menu.

When you switch themes, compound blocks not supported by the new theme will show a yellow warning border. Content remains editable, and styles restore automatically when you switch back to a supporting theme.

### Reorder blocks

Use the drag handle that appears on the left side of each block to reorder.

### Text formatting

Select text to reveal the floating toolbar: bold, italic, underline, inline code.

### Table operations

When inserting a table, a panel lets you choose the number of rows and columns. After insertion, selecting the table shows table operations in the floating toolbar (add row, delete row, etc.).

---

## 5. Theme System

### What is a theme

A theme controls the visual style of your handout — fonts, colors, spacing, and block appearance. Themes only affect content inside the `.page` container, not the editor UI itself.

### Built-in themes

Click "Theme" in the toolbar → "Built-in Themes". Three themes are available:

| Theme | Style |
|---|---|
| Slate | Slate gray, fine borders, technical handouts |
| Washi | Warm off-white, washi paper feel, humanities |
| Moss | Low-saturation green accent, natural, general purpose |

### Import a custom theme

Click "Theme" → "Import Folder" and select a folder containing `theme.css` and `theme.json`.

### Paste CSS

Click "Theme" → "Paste CSS" to paste CSS directly — quick for testing, no compound blocks.

### Reset theme

Click "Theme" → "Reset to Default" to clear the current theme.

---

## 6. Math Equations

### Insert an equation

Press `/` and select "Inline math" or "Block math" to insert a placeholder equation.

- **Inline math**: Embedded within paragraph text
- **Block math**: Standalone, centered on its own line

### Edit an equation

Click an equation to open the edit modal, which includes:

- **Preview**: Live-rendered result; shows an error message for invalid syntax
- **LaTeX input**: Type or modify LaTeX
- **Snippet buttons**: Click to insert common syntax quickly

Click "Confirm" to apply changes; "Cancel" to discard.

### Common LaTeX reference

| Syntax | Result |
|---|---|
| `E=mc^2` | Superscript |
| `x_{n}` | Subscript |
| `\frac{a}{b}` | Fraction |
| `\sqrt{x}` | Square root |
| `\int_{a}^{b} f(x)\,dx` | Integral |
| `\sum_{i=1}^{n}` | Summation |
| `\alpha \beta \gamma` | Greek letters |

---

## 7. Images

### Insert an image

Press `/` and select "Image" to insert a placeholder. Click the placeholder to choose a local image file (PNG, JPG, GIF, WebP supported).

### How images are stored

Images are stored as binary data inside the `.handout` package under `assets/`, keeping the document JSON lean.

### Images on export

When exporting HTML, images are automatically converted to base64 inline. The exported HTML file is fully self-contained with no external dependencies.

---

## 8. Export and Print

### Export HTML

Click "Export HTML" in the toolbar and choose a save location. The output file includes:
- Full theme CSS (inline)
- All images (base64 inline)
- KaTeX CSS link (if the document contains math equations)

### Print to PDF

Open the exported HTML file in a browser and press `Ctrl+P` (Windows) or `Cmd+P` (macOS).

Recommended settings:
- Paper size: A4
- Margins: None (the theme CSS controls internal padding)
- Background graphics: On (ensures theme background colors print correctly)

Each page maps to one sheet of A4. Content does not flow automatically across pages.

---

## 9. Keyboard Shortcuts

### Editor shortcuts

| Shortcut | Action |
|---|---|
| `/` | Open block menu |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

### Markdown input shortcuts

Type the following and press Space to auto-convert:

| Input | Converts to |
|---|---|
| `#` + Space | Heading 1 |
| `##` + Space | Heading 2 |
| `###` + Space | Heading 3 |
| `-` or `*` + Space | Bullet list |
| `1.` + Space | Ordered list |
| `>` + Space | Blockquote |
| `---` | Divider |

---

## 10. Notes

**No automatic page flow**

Chiatom is designed around the idea that you control which content goes on which page. There is no automatic reflow across pages. When content overflows, a warning appears and you handle it manually.

**The `.handout` format**

`.handout` files are zip archives. Do not unzip and manually edit them with other tools — this may corrupt the file structure.

**Math equations offline**

Exported HTML loads KaTeX fonts via CDN. In a fully offline environment, equations will still render but fonts may fall back to system fonts. This has minimal impact on print output.

**Theme CSS scope**

Theme CSS only affects styles inside `.page`. It cannot modify the editor UI (toolbar, sidebar, etc.).
