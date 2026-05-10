import { create } from 'zustand'
import { JSONContent } from '@tiptap/react'
import { useLangStore } from './langStore'

// ============================================
// 型別定義
// ============================================

export interface Page {
  id: string
  title: string       // 左側面板顯示用（取自第一個 h1，或「頁面 N」）
  content: JSONContent // Tiptap JSON
}

export interface ThemeConfig {
  name: string
  css: string         // inline CSS 字串
  json: ThemeDefinition
}

export interface ThemeDefinition {
  name: string
  version: string
  author: string
  description: string
  pageSize: 'A4'
  blocks: CompoundBlockDef[]
}

export interface CompoundBlockDef {
  name: string
  key: string
  icon: string
  class: string
  children: { type: string; placeholder: string }[]
}

export interface Document {
  id: string
  title: string
  theme: ThemeConfig
  pages: Page[]
  createdAt: string
  updatedAt: string
}

// ============================================
// Store
// ============================================

interface DocumentStore {
  // 狀態
  document: Document
  activePageId: string

  // 頁面操作
  addPage: () => void
  deletePage: (id: string) => void
  duplicatePage: (id: string) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  setActivePage: (id: string) => void

  // 頁面內容更新
  updatePageContent: (id: string, content: JSONContent) => void
  updatePageTitle: (id: string, title: string) => void

  // 文件操作
  setDocumentTitle: (title: string) => void

  // 主題操作
  setTheme: (theme: ThemeConfig) => void
  loadFromDocument: (doc: Document) => void
}

export const useDocumentStore = create<DocumentStore>()((set) => {
  const t = useLangStore.getState().t

  const defaultTheme: ThemeConfig = {
    name: t.defaultThemeName,
    css: '',
    json: {
      name: t.defaultThemeName,
      version: '1.0.0',
      author: '',
      description: '',
      pageSize: 'A4',
      blocks: [],
    },
  }

  const createEmptyPage = (index: number): Page => ({
    id: crypto.randomUUID(),
    title: `${t.defaultPageTitle} ${index}`,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  })

  const createNewDocument = (): Document => ({
    id: crypto.randomUUID(),
    title: t.untitledDocument,
    theme: defaultTheme,
    pages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return {
    document: createNewDocument(),
    activePageId: '', // 初始化後在 App 層設定

    // ── 頁面操作 ──────────────────────────────

    addPage: () => set((state) => {
      const pages = state.document.pages
      const newPage = createEmptyPage(pages.length + 1)
      return {
        document: {
          ...state.document,
          pages: [...pages, newPage],
          updatedAt: new Date().toISOString(),
        },
        activePageId: newPage.id,
      }
    }),

    deletePage: (id) => set((state) => {
      const pages = state.document.pages
      if (pages.length <= 1) return state // 至少保留一頁

      const newPages = pages.filter(p => p.id !== id)
      const currentIndex = pages.findIndex(p => p.id === id)

      // 刪除後選取相鄰頁面
      const nextActive = newPages[Math.min(currentIndex, newPages.length - 1)]

      return {
        document: {
          ...state.document,
          pages: newPages,
          updatedAt: new Date().toISOString(),
        },
        activePageId: nextActive.id,
      }
    }),

    duplicatePage: (id) => set((state) => {
      const pages = state.document.pages
      const index = pages.findIndex(p => p.id === id)
      if (index === -1) return state

      const original = pages[index]
      const duplicate: Page = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title}（複製）`,
      }

      const newPages = [...pages]
      newPages.splice(index + 1, 0, duplicate)

      return {
        document: {
          ...state.document,
          pages: newPages,
          updatedAt: new Date().toISOString(),
        },
        activePageId: duplicate.id,
      }
    }),

    reorderPages: (fromIndex, toIndex) => set((state) => {
      const pages = [...state.document.pages]
      const [moved] = pages.splice(fromIndex, 1)
      pages.splice(toIndex, 0, moved)

      return {
        document: {
          ...state.document,
          pages,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

    setActivePage: (id) => set({ activePageId: id }),

    // ── 頁面內容 ──────────────────────────────

    updatePageContent: (id, content) => set((state) => ({
      document: {
        ...state.document,
        pages: state.document.pages.map(p =>
          p.id === id ? { ...p, content } : p
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

    updatePageTitle: (id, title) => set((state) => ({
      document: {
        ...state.document,
        pages: state.document.pages.map(p =>
          p.id === id ? { ...p, title } : p
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

    // ── 文件操作 ──────────────────────────────

    setDocumentTitle: (title) => set((state) => ({
      document: {
        ...state.document,
        title,
        updatedAt: new Date().toISOString(),
      },
    })),

    // ── 主題操作 ──────────────────────────────

    setTheme: (theme) => set((state) => ({
      document: {
        ...state.document,
        theme,
        updatedAt: new Date().toISOString(),
      },
    })),

    loadFromDocument: (doc) => set(() => ({
      document: doc,
      activePageId: doc.pages[0]?.id ?? '',
    })),
  }
})
