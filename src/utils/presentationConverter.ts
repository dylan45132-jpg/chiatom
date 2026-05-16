import type { Document, Page } from '../store/documentStore'
import type { JSONContent } from '@tiptap/react'
import { getBuiltinThemes } from '../theme/builtinThemes'

function extractPlainText(doc: Document): JSONContent {
  const allNodes: JSONContent[] = []
  
  doc.pages.forEach((page, index) => {
    // 加入頁面標題作為分隔
    if (index > 0) {
      allNodes.push({ type: 'horizontalRule' })
    }
    // 直接把原始 Tiptap JSON nodes 加進去
    const nodes = page.content.content ?? []
    allNodes.push(...nodes)
  })

  return {
    type: 'doc',
    content: allNodes.length > 0 ? allNodes : [{ type: 'paragraph' }]
  }
}

/**
 * 將講義 Document 轉換為簡報 Document
 * - 所有頁面內容合併為純文字，放入唯一的空白頁面的 speakerNotes 中
 * - mode 設為 'presentation'
 * - 套上預設簡報主題 Deck
 */
export function convertToPresentation(source: Document): Document {
  const presentationThemes = getBuiltinThemes('presentation')
  const defaultTheme = presentationThemes.find(t => t.id === 'deck') ?? presentationThemes[0]

  const blankPage: Page = {
    id: crypto.randomUUID(),
    title: '投影片 1',
    content: { type: 'doc', content: [] },
  }

  return {
    id: crypto.randomUUID(),
    title: source.title + ' — 簡報',
    mode: 'presentation',
    theme: {
      name: defaultTheme.name,
      css: defaultTheme.css,
      json: defaultTheme.json,
    },
    pages: [blankPage],
    speakerNotes: extractPlainText(source),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}