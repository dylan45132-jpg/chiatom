import { create } from 'zustand'

export type View = 'home' | 'editor' | 'settings' | 'zotero-projects' | 'about' | 'theme-store' | 'theme-customize' | 'library'

export interface NavEntry {
  view: View
  savePath?: string
  pageId?: string
}

interface NavigationState {
  currentView: View
  history: NavEntry[]
  navigate: (target: View | NavEntry) => void
  goBack: () => void
  canGoBack: () => boolean
}

function toEntry(target: View | NavEntry): NavEntry {
  if (typeof target === 'string') return { view: target }
  return target
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'home',
  history: [],

  navigate: (target) => {
    const entry = toEntry(target)
    const current = get().currentView
    set((state) => ({
      history: [...state.history, { view: current }],
      currentView: entry.view,
    }))
    if (entry.view === 'editor' && (entry.savePath || entry.pageId)) {
      import('../store/documentStore').then(({ useDocumentStore }) => {
        if (entry.pageId) {
          useDocumentStore.getState().setActivePage(entry.pageId)
        }
      })
    }
  },

  goBack: () => {
    const history = get().history
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({
      currentView: prev.view,
      history: history.slice(0, -1),
    })
    if (prev.view === 'editor' && (prev.savePath || prev.pageId)) {
      import('../store/documentStore').then(async ({ useDocumentStore }) => {
        if (prev.savePath) {
          const { loadHandoutFromPath } = await import('../utils/handoutPackage')
          const result = await loadHandoutFromPath(prev.savePath)
          if (result) {
            useDocumentStore.getState().loadFromDocument(result.doc, prev.savePath)
          }
        }
        if (prev.pageId) {
          useDocumentStore.getState().setActivePage(prev.pageId)
        }
      })
    }
  },

  canGoBack: () => get().history.length > 0,
}))