import { JSONContent } from '@tiptap/react'
import { ThemeConfig } from '../store/documentStore'
import katex from 'katex'

// ============================================
// Tiptap JSON → HTML 轉換器
// ============================================

function renderChildren(node: JSONContent): string {
  if (!node.content) return ''
  return node.content.map(renderNode).join('')
}

function renderMarks(text: string, marks?: JSONContent['marks']): string {
  if (!marks || marks.length === 0) return text
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':      return `<strong>${acc}</strong>`
      case 'italic':    return `<em>${acc}</em>`
      case 'underline': return `<u>${acc}</u>`
      case 'strike':    return `<s>${acc}</s>`
      case 'code':      return `<code>${acc}</code>`
      default:          return acc
    }
  }, text)
}

function renderNode(node: JSONContent): string {
  switch (node.type) {
    case 'doc':
      return renderChildren(node)

    case 'text':
      return renderMarks(
        (node.text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        node.marks
      )

    case 'paragraph': {
      const inner = renderChildren(node)
      return `<p>${inner || '&nbsp;'}</p>`
    }

    case 'heading': {
      const level = node.attrs?.level ?? 1
      return `<h${level}>${renderChildren(node)}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${renderChildren(node)}</ul>`

    case 'orderedList':
      return `<ol>${renderChildren(node)}</ol>`

    case 'listItem':
      return `<li>${renderChildren(node)}</li>`

    case 'blockquote':
      return `<blockquote>${renderChildren(node)}</blockquote>`

    case 'horizontalRule':
      return `<hr>`

    case 'hardBreak':
      return `<br>`

    case 'codeBlock':
      return `<pre><code>${renderChildren(node)}</code></pre>`

    case 'compoundBlock': {
      const blockClass = node.attrs?.class ?? ''
      return `<div class="${blockClass}">${renderChildren(node)}</div>`
    }

    case 'imagePlaceholder': {
      if (node.attrs?.src) {
        const alt = node.attrs?.alt ?? ''
        return `<img src="${node.attrs.src}" alt="${alt}" style="max-width:100%;display:block;margin:0.75em 0;">`
      }
      return `<div style="padding:16px;border:2px dashed #ccc;text-align:center;color:#999;margin:0.75em 0;">[圖片]</div>`
    }

    case 'inlineMath':
      try {
        return katex.renderToString(node.attrs?.latex || '', {
          throwOnError: false,
          displayMode: false,
        })
      } catch {
        return `<span>${node.attrs?.latex || ''}</span>`
      }

    case 'blockMath':
      try {
        return katex.renderToString(node.attrs?.latex || '', {
          throwOnError: false,
          displayMode: true,
        })
      } catch {
        return `<div>${node.attrs?.latex || ''}</div>`
      }

    case 'table':
      return `<table>${renderChildren(node)}</table>`

    case 'tableRow':
      return `<tr>${renderChildren(node)}</tr>`

    case 'tableHeader':
      return `<th>${renderChildren(node)}</th>`

    case 'tableCell':
      return `<td>${renderChildren(node)}</td>`

    default:
      return renderChildren(node)
  }
}

function hasMathNode(node: JSONContent): boolean {
  if (node.type === 'inlineMath' || node.type === 'blockMath') {
    return true
  }
  if (node.content) {
    return node.content.some(hasMathNode)
  }
  return false
}

// ============================================
// 整份文件 → 完整 HTML
// ============================================

export function exportToHtml(
  pages: { title: string; content: JSONContent }[],
  docTitle: string,
  theme: ThemeConfig
): string {
  const hasMath = pages.some(page => hasMathNode(page.content))

  const pagesHtml = pages.map(page => {
    const content = renderNode(page.content)
    return `  <div class="page">\n${content}\n  </div>`
  }).join('\n\n')

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  ${hasMath ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.x/dist/katex.min.css">' : ''}
  <style>
    /* ── Print base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

    .page {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      padding: 20mm 22mm;
      margin: 12mm auto;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }

    p  { margin-bottom: 0.75em; line-height: 1.7; }
    h1 { font-size: 1.8em; font-weight: 700; margin-bottom: 0.5em; }
    h2 { font-size: 1.4em; font-weight: 600; margin-bottom: 0.4em; }
    h3 { font-size: 1.15em; font-weight: 600; margin-bottom: 0.35em; }
    ul, ol { padding-left: 1.5em; margin-bottom: 0.75em; }
    li { margin-bottom: 0.25em; line-height: 1.6; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #555; margin: 0.75em 0; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1em 0; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; margin-bottom: 0.75em; }
    code { font-family: monospace; font-size: 0.9em; }

    /* ── Theme CSS ── */
${theme.css ? theme.css.split('\n').map(l => '    ' + l).join('\n') : ''}

    /* ── Table ── */
    table { border-collapse: collapse; width: 100%; margin-bottom: 0.75em; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; vertical-align: top; min-width: 80px; }
    th { background: #f3f4f6; font-weight: 600; text-align: left; }
    table p { margin: 0; }

    /* ── Print ── */
    @media print {
      body { background: none; }
      .page { margin: 0; box-shadow: none; page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}