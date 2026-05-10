English | [繁體中文](README.zh.md)

# Chiatom

A block-based handout editor built around A4 pages. What you edit is what you print.

---

## What is this

Chiatom is a desktop application designed for teachers, instructors, and course designers who regularly create structured handouts.

Most tools don't solve a real problem: **LLMs can generate beautiful HTML handout layouts, but there's no tool that lets you fill in content directly within that layout.**

- Typora is a great Markdown editor, but you can't control where content appears on the page
- Notion's page feel is an illusion — print results are unpredictable
- Word can't apply custom HTML layouts

Chiatom's approach: pages are first-class citizens. You edit directly on an A4 page, and what you see is exactly what gets printed.

---

## Features

- **A4 page editing**: Each page is fixed to A4 size — true WYSIWYG
- **Block system**: Headings, paragraphs, lists, tables, blockquotes, images, and math equations (KaTeX)
- **Theme system**: Import custom theme packages (theme.css + theme.json), or use one of the three built-in themes
- **Compound blocks**: Custom blocks defined by the theme, inserted via the `/` command menu
- **Math support**: Inline and block LaTeX with live preview
- **HTML export**: A single self-contained HTML file with inline CSS and base64 images, ready to print as PDF in any browser
- **`.handout` format**: A packaged file format that bundles document data and image assets

---

## Installation

> **Installer coming soon.** Please build from source for now.

### Requirements

- Node.js 24.x
- pnpm 10.x
- Rust (required for Tauri builds)

### Build from source

```bash
# Clone the repository
git clone https://github.com/dylan45132-jpg/chiatom.git
cd chiatom

# Install dependencies
pnpm install

# Start in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

The built installer will be in `src-tauri/target/release/bundle/`.

---

## Quick start

1. Launch the app — you'll see an onboarding screen
2. Click "Theme" in the toolbar and pick a built-in theme (Slate / Washi / Moss)
3. Click "＋" in the left sidebar to add your first page
4. Type directly on the page, or press `/` to insert a block
5. When done, click "Export HTML" and open the file in a browser to print as PDF

---

## Themes

The visual style of your handout is entirely controlled by themes. A theme package contains two files:

```
my-theme/
├── theme.css    # Page styles
└── theme.json   # Theme metadata and compound block definitions
```

To import: click "Theme" in the toolbar → "Import Folder", then select your theme folder.

For details on creating your own theme, see [docs/en/theme-guide.md](docs/en/theme-guide.md).

---

## Tech stack

| Layer | Choice |
|---|---|
| Desktop framework | Tauri v2 |
| Frontend | React 19 + TypeScript + Vite 7 |
| Editor engine | Tiptap 3.23.x |
| State management | Zustand 5.x |
| File format | JSZip (.handout) |

---

## Project status

- Phase 1 MVP ✅
- Phase 2 Full editing experience ✅
- Phase 3 Polish ✅
- Phase 4 Open source preparation ⬜

---

## License

Chiatom is open source under the [GNU General Public License v3.0](LICENSE).

Theme packages (theme.css + theme.json) are published separately under the MIT License, so the community can freely create, share, and sell themes without GPL restrictions.
See [chiatom-themes](https://github.com/dylan45132-jpg/chiatom-themes).

---
