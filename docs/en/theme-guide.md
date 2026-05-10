# Chiatom Theme Guide

---

## Table of Contents

1. [Theme Package Structure](#1-theme-package-structure)
2. [theme.json Specification](#2-themejson-specification)
3. [theme.css Specification](#3-themecss-specification)
4. [Compound Block Definitions](#4-compound-block-definitions)
5. [Print Styles](#5-print-styles)
6. [Designing Themes with an LLM](#6-designing-themes-with-an-llm)
7. [Testing Your Theme](#7-testing-your-theme)
8. [Example Themes](#8-example-themes)

---

## 1. Theme Package Structure

A theme package is a folder containing two files:

```
my-theme/
├── theme.css     # Page styles (required)
└── theme.json    # Theme metadata and compound block definitions (optional)
```

`theme.css` is required. `theme.json` is optional — a theme without it can still be applied, it just won't have compound blocks.

To import: click "Theme" in the Chiatom toolbar → "Import Folder", then select your theme folder.

---

## 2. theme.json Specification

```json
{
  "name": "My Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A one-line description of this theme",
  "pageSize": "A4",
  "blocks": []
}
```

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name of the theme |
| `version` | string | Version string, any format |
| `author` | string | Author name (can be empty) |
| `description` | string | Short description |
| `pageSize` | string | Currently fixed to `"A4"` |
| `blocks` | array | Compound block definitions — see Section 4 |

---

## 3. theme.css Specification

### Scope

All theme styles must be scoped inside the `.page` class. `.page` is the root container for each A4 page.

```css
/* ✅ Correct: scoped inside .page */
.page h1 { ... }
.page p { ... }

/* ❌ Wrong: global styles will affect the editor UI */
h1 { ... }
body { ... }
```

### Page container

The editor controls `.page`'s `width`, `min-height`, and `padding`. Your theme should not set these.

You can set the following on `.page`:

```css
.page {
  font-family: ...;   /* Typeface */
  font-size: ...;     /* Base font size */
  line-height: ...;   /* Line height */
  color: ...;         /* Base text color */
  background: ...;    /* Page background */
}
```

### CSS selectors for basic blocks

| Block | CSS selector |
|---|---|
| Heading 1 | `.page h1` |
| Heading 2 | `.page h2` |
| Heading 3 | `.page h3` |
| Paragraph | `.page p` |
| Bullet list | `.page ul`, `.page ul li` |
| Ordered list | `.page ol`, `.page ol li` |
| Blockquote | `.page blockquote` |
| Table | `.page table`, `.page th`, `.page td` |
| Divider | `.page hr` |
| Image | `.page img` |

### Minimal working theme.css

```css
.page {
  font-family: 'Georgia', serif;
  font-size: 13px;
  line-height: 1.75;
  color: #1a1a1a;
  background: #ffffff;
}

.page h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a1a1a;
}

.page h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 24px 0 10px 0;
}

.page h3 {
  font-size: 13px;
  font-weight: 700;
  margin: 16px 0 6px 0;
}

.page p {
  margin: 0 0 10px 0;
}

.page ul,
.page ol {
  margin: 0 0 10px 0;
  padding-left: 20px;
}

.page li {
  margin-bottom: 4px;
}

.page blockquote {
  border-left: 3px solid #cccccc;
  margin: 12px 0;
  padding: 6px 16px;
  color: #666666;
}

.page table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 12px;
}

.page th {
  background: #1a1a1a;
  color: #ffffff;
  padding: 6px 10px;
  text-align: left;
}

.page td {
  border: 1px solid #cccccc;
  padding: 5px 10px;
}

.page hr {
  border: none;
  border-top: 1px solid #cccccc;
  margin: 18px 0;
}

.page img {
  max-width: 100%;
  display: block;
  margin: 12px auto;
}
```

---

## 4. Compound Block Definitions

Compound blocks are semantic groupings of basic blocks — for example, a "Key Points" box or a "Core Objective" section.

### Definition in theme.json

```json
{
  "blocks": [
    {
      "name": "Key Points",
      "key": "summary-box",
      "icon": "📋",
      "class": "block-summary-box",
      "children": [
        { "type": "label", "placeholder": "Label text" },
        { "type": "ol", "placeholder": "List your points..." }
      ]
    }
  ]
}
```

| Field | Description |
|---|---|
| `name` | Display name shown in the `/` menu |
| `key` | Unique identifier — lowercase with hyphens, must be unique |
| `icon` | Icon shown in the `/` menu (emoji or text) |
| `class` | CSS class applied to the wrapper div |
| `children` | Array of child block definitions |

### Supported child types

| type | Description |
|---|---|
| `label` | Single-line label text |
| `p` | Paragraph |
| `ol` | Ordered list |
| `ul` | Unordered list |

### Corresponding theme.css styles

Each compound block needs matching styles in `theme.css`:

```css
/* Matches key: "summary-box", class: "block-summary-box" */
.page .block-summary-box {
  border: 1px solid #cccccc;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 12px 0;
  background: #f9f9f9;
}

.page .block-summary-box .block-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666666;
  margin-bottom: 6px;
}
```

### Fallback behavior

If a document uses a compound block that the current theme doesn't define, the block displays a yellow warning border. Content remains editable, and styles restore automatically when switching back to a theme that supports the block.

---

## 5. Print Styles

When printing the exported HTML in a browser, add `@media print` rules to ensure background colors and images print correctly.

### Basic print setup

```css
@media print {
  .page {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### If your theme uses colored backgrounds

```css
@media print {
  .page {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: #your-background-color;
  }
}
```

You don't need to handle page breaks in your theme CSS — Chiatom already handles `break-after: page` for each `.page` globally.

---

## 6. Designing Themes with an LLM

Chiatom's theme system is designed to be LLM-friendly. You can use ChatGPT, Claude, or any other LLM to generate theme CSS and import it directly.

### Recommended prompt structure

```
Design a theme.css file for Chiatom, a document editor.

Requirements:
- All styles must be scoped inside the .page class (e.g. .page h1 { ... })
- Do NOT set width, min-height, or padding on .page (the editor controls these)
- Cover these selectors: .page, .page h1, .page h2, .page h3, .page p,
  .page ul, .page ol, .page li, .page blockquote, .page table,
  .page th, .page td, .page hr, .page img

Style: [describe your desired aesthetic, e.g. dark academic, minimal Japanese, warm earthy...]
Primary color: [describe color preference]
Font: [Georgia / system-ui / or specify a Google Font name]
```

### Design tips

- Avoid neon gradients or purple as a primary color
- Limit non-neutral accent colors to 1–2 per theme
- Keep heading hierarchy clear through size and weight contrast, not decoration
- Table `th` background and `td` alternating rows can echo your accent color

---

## 7. Testing Your Theme

### Recommended checklist

After importing a theme, verify the following in a test document:

- [ ] h1, h2, h3 have clear visual hierarchy
- [ ] Body text is readable (font, size, line height, color)
- [ ] Bullet and ordered list indentation and markers look correct
- [ ] Blockquote left border and text color render well
- [ ] Table column alignment, borders, and alternating rows work
- [ ] Images align correctly within the page
- [ ] Math equations (if used) pair well with the body font
- [ ] Page background color displays correctly in the editor
- [ ] Print preview in browser looks correct after exporting HTML

### Quick test workflow

1. Create a new test page in Chiatom
2. Use the `/` menu to insert one of each block type
3. Apply your theme and inspect each block's appearance
4. Export HTML, open in a browser, and check the print preview

---

## 8. Example Themes

Chiatom ships with three built-in themes you can use as a starting point:

| Theme | Style | Notable features |
|---|---|---|
| Slate | Slate gray, technical | h1 bottom border, h2 left border, dark table header |
| Washi | Warm off-white, humanities | Centered h1, warm brown tones, soft table styling |
| Moss | Green accent, general purpose | h1 left color block, green accent throughout |

The source CSS for each built-in theme is in `src/theme/themes/` — copy and modify freely as a base for your own theme.
