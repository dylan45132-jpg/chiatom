import { Extension } from '@tiptap/core'
import Suggestion, {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion'
import { PluginKey } from 'prosemirror-state'
import { getSettings } from '../../store/settingsStore'
import { readWorkspace } from '../../utils/workspace'
import { readHandoutMeta } from '../../utils/handoutPackage'

const PageReferencePluginKey = new PluginKey('page-reference')

interface DocGroup {
  docId: string
  docName: string
  pages: { pageId: string; pageTitle: string }[]
}

interface FlatItem {
  type: 'doc' | 'page'
  docId: string
  docName: string
  pageId?: string
  pageTitle?: string
}

let cachedGroups: DocGroup[] | null = null

async function loadDocGroups(): Promise<DocGroup[]> {
  if (cachedGroups) return cachedGroups
  const workspacePath = getSettings().workspacePath
  if (!workspacePath) return []
  try {
    const structure = await readWorkspace(workspacePath)
    const allFiles = [
      ...structure.rootFiles,
      ...structure.folders.flatMap(f => f.files),
    ]
    const groups: DocGroup[] = []
    await Promise.all(
      allFiles.map(async file => {
        const meta = await readHandoutMeta(file.path)
        if (!meta) return
        groups.push({
          docId: file.path,
          docName: file.name,
          pages: meta.pages.map(p => ({ pageId: p.id, pageTitle: p.title })),
        })
      })
    )
    cachedGroups = groups
    return groups
  } catch {
    return []
  }
}

export function clearPageReferenceCache() {
  cachedGroups = null
}

function buildFlatItems(groups: DocGroup[], query: string, expandedDocs: Set<string>): FlatItem[] {
  const q = query.toLowerCase()
  const items: FlatItem[] = []
  for (const group of groups) {
    const docMatch = !q || group.docName.toLowerCase().includes(q)
    const matchingPages = group.pages.filter(p =>
      !q || p.pageTitle.toLowerCase().includes(q) || group.docName.toLowerCase().includes(q)
    )
    if (!docMatch && matchingPages.length === 0) continue
    items.push({ type: 'doc', docId: group.docId, docName: group.docName })
    if (expandedDocs.has(group.docId)) {
      const pagesToShow = q ? matchingPages : group.pages
      for (const page of pagesToShow) {
        items.push({
          type: 'page',
          docId: group.docId,
          docName: group.docName,
          pageId: page.pageId,
          pageTitle: page.pageTitle,
        })
      }
    }
  }
  return items.slice(0, 60)
}

function createMenuDom() {
  const root = document.createElement('div')
  root.className = 'slash-menu'
  root.style.maxHeight = '320px'
  root.style.overflowY = 'auto'
  root.style.minWidth = '240px'
  const list = document.createElement('div')
  list.className = 'slash-menu-list'
  root.appendChild(list)
  document.body.appendChild(root)
  return { root, list }
}

function updateMenuPosition(root: HTMLDivElement, clientRect: (() => DOMRect | null) | null | undefined) {
  const rect = clientRect?.()
  if (!rect) return
  const GAP = 8
  let left = rect.left
  let top = rect.bottom + GAP
  const rootRect = root.getBoundingClientRect()
  if (left + rootRect.width > window.innerWidth - GAP)
    left = Math.max(GAP, window.innerWidth - rootRect.width - GAP)
  if (top + rootRect.height > window.innerHeight - GAP)
    top = Math.max(GAP, rect.top - rootRect.height - GAP)
  root.style.left = `${left}px`
  root.style.top = `${top}px`
}

function renderItems(
  list: HTMLDivElement,
  items: FlatItem[],
  selectedIndex: number,
  expandedDocs: Set<string>,
  onSelectDoc: (item: FlatItem) => void,
  onSelectPage: (item: FlatItem) => void,
  onToggleDoc: (docId: string) => void,
) {
  list.innerHTML = ''
  if (items.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'slash-menu-empty'
    empty.textContent = '找不到符合的頁面'
    list.appendChild(empty)
    return
  }
  items.forEach((item, index) => {
    const row = document.createElement('div')
    row.className = `slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`
    row.style.display = 'flex'
    row.style.alignItems = 'center'
    row.style.gap = '4px'

    if (item.type === 'doc') {
      row.style.fontWeight = '500'
      row.style.paddingLeft = '8px'

      const arrow = document.createElement('span')
      arrow.style.fontSize = '10px'
      arrow.style.width = '14px'
      arrow.style.flexShrink = '0'
      arrow.style.cursor = 'pointer'
      arrow.textContent = expandedDocs.has(item.docId) ? '▼' : '▶'
      arrow.addEventListener('mousedown', e => {
        e.preventDefault()
        e.stopPropagation()
        onToggleDoc(item.docId)
      })

      const icon = document.createElement('span')
      icon.className = 'slash-menu-icon'
      icon.textContent = '📄'

      const label = document.createElement('span')
      label.className = 'slash-menu-label'
      label.textContent = item.docName
      label.style.flex = '1'

      row.appendChild(arrow)
      row.appendChild(icon)
      row.appendChild(label)
      row.addEventListener('mousedown', e => {
        e.preventDefault()
        onSelectDoc(item)
      })
    } else {
      row.style.paddingLeft = '32px'
      row.style.fontSize = '13px'

      const icon = document.createElement('span')
      icon.className = 'slash-menu-icon'
      icon.textContent = '↳'

      const label = document.createElement('span')
      label.className = 'slash-menu-label'
      label.textContent = item.pageTitle ?? ''

      row.appendChild(icon)
      row.appendChild(label)
      row.addEventListener('mousedown', e => {
        e.preventDefault()
        onSelectPage(item)
      })
    }
    list.appendChild(row)
  })
}

export const PageReferenceSuggestion = Extension.create({
  name: 'page-reference-suggestion',

  addProseMirrorPlugins() {
    return [
      Suggestion<FlatItem>({
        editor: this.editor,
        pluginKey: PageReferencePluginKey,
        char: '@',
        allowSpaces: false,
        startOfLine: false,
        allowedPrefixes: null,

        items: async ({ query }) => {
          const groups = await loadDocGroups()
          return buildFlatItems(groups, query, new Set())
        },

        command: ({ editor, range, props }) => {
          if (props.type === 'doc') {
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'pageReference',
              attrs: {
                docId: props.docId,
                pageId: '',
                label: props.docName,
              },
            }).run()
          } else {
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'pageReference',
              attrs: {
                docId: props.docId,
                pageId: props.pageId ?? '',
                label: `${props.docName} · ${props.pageTitle}`,
              },
            }).run()
          }
        },

        render: () => {
          let dom: ReturnType<typeof createMenuDom> | null = null
          let propsRef: SuggestionProps<FlatItem> | null = null
          let selectedIndex = 0
          let expandedDocs: Set<string> = new Set()
          let currentQuery = ''
          let currentGroups: DocGroup[] = []

          const rerender = () => {
            if (!dom || !propsRef) return
            const items = buildFlatItems(currentGroups, currentQuery, expandedDocs)
            renderItems(dom.list, items, selectedIndex, expandedDocs, selectDoc, selectPage, toggleDoc)
            updateMenuPosition(dom.root, propsRef.clientRect)
            propsRef = { ...propsRef, items }
            if (selectedIndex >= items.length) selectedIndex = Math.max(0, items.length - 1)
          }

          const toggleDoc = (docId: string) => {
            if (expandedDocs.has(docId)) expandedDocs.delete(docId)
            else expandedDocs.add(docId)
            rerender()
          }

          const selectDoc = (item: FlatItem) => {
            if (!propsRef) return
            propsRef.command(item)
            exitSuggestion(propsRef.editor.view, PageReferencePluginKey)
          }

          const selectPage = (item: FlatItem) => {
            if (!propsRef) return
            propsRef.command(item)
            exitSuggestion(propsRef.editor.view, PageReferencePluginKey)
          }

          return {
            onStart: async (props) => {
              propsRef = props
              currentQuery = ''
              selectedIndex = 0
              expandedDocs = new Set()
              currentGroups = await loadDocGroups()
              dom = createMenuDom()
              const items = buildFlatItems(currentGroups, currentQuery, expandedDocs)
              renderItems(dom.list, items, selectedIndex, expandedDocs, selectDoc, selectPage, toggleDoc)
              updateMenuPosition(dom.root, props.clientRect)
              propsRef = { ...propsRef, items }
            },

            onUpdate: async (props) => {
              propsRef = props
              currentQuery = props.query ?? ''
              if (!dom) return
              currentGroups = await loadDocGroups()
              const items = buildFlatItems(currentGroups, currentQuery, expandedDocs)
              if (selectedIndex >= items.length) selectedIndex = 0
              renderItems(dom.list, items, selectedIndex, expandedDocs, selectDoc, selectPage, toggleDoc)
              updateMenuPosition(dom.root, props.clientRect)
              propsRef = { ...propsRef, items }
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (!propsRef || !dom) return false
              const items = propsRef.items
              const count = items.length

              if (props.event.key === 'ArrowDown') {
                props.event.preventDefault()
                if (count > 0) {
                  selectedIndex = (selectedIndex + 1) % count
                  renderItems(dom.list, items, selectedIndex, expandedDocs, selectDoc, selectPage, toggleDoc)
                }
                return true
              }
              if (props.event.key === 'ArrowUp') {
                props.event.preventDefault()
                if (count > 0) {
                  selectedIndex = (selectedIndex - 1 + count) % count
                  renderItems(dom.list, items, selectedIndex, expandedDocs, selectDoc, selectPage, toggleDoc)
                }
                return true
              }
              if (props.event.key === 'Enter') {
                props.event.preventDefault()
                const item = items[selectedIndex]
                if (!item) return true
                if (item.type === 'doc') toggleDoc(item.docId)
                else selectPage(item)
                return true
              }
              if (props.event.key === 'Escape') {
                props.event.preventDefault()
                if (propsRef) exitSuggestion(propsRef.editor.view, PageReferencePluginKey)
                return true
              }
              return false
            },

            onExit: () => {
              dom?.root.remove()
              dom = null
              propsRef = null
              selectedIndex = 0
              expandedDocs = new Set()
              currentQuery = ''
              currentGroups = []
            },
          }
        },
      }),
    ]
  },
})