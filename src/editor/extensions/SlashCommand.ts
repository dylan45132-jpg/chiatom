import { Extension, type Range } from '@tiptap/core'
import Suggestion, {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion'
import { PluginKey } from 'prosemirror-state'
import type { Editor } from '@tiptap/react'
import { useDocumentStore } from '../../store/documentStore' 

const SlashCommandPluginKey = new PluginKey('slash-command')

type SlashItem = {
  title: string
  description?: string
  icon: string
  keywords?: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

const slashItems: SlashItem[] = [
  {
    title: '段落',
    icon: '¶',
    keywords: ['p', 'paragraph', 'text'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: '大標題',
    icon: 'H1',
    keywords: ['h1', 'heading1', 'title'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    title: '中標題',
    icon: 'H2',
    keywords: ['h2', 'heading2'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    title: '小標題',
    icon: 'H3',
    keywords: ['h3', 'heading3'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    title: '無序清單',
    icon: '•',
    keywords: ['ul', 'bullet', 'list'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: '有序清單',
    icon: '1.',
    keywords: ['ol', 'ordered', 'numbered'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: '引用',
    icon: '"',
    keywords: ['quote', 'blockquote'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: '分隔線',
    icon: '—',
    keywords: ['hr', 'divider', 'rule'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: '表格',
    icon: '⊞',
    keywords: ['table', 'grid'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: '圖片',
    icon: '🖼',
    keywords: ['image', 'photo', 'picture'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertContent({ type: 'imagePlaceholder', attrs: {} }).run(),
  },
  {
    title: '行內方程式',
    icon: '∫',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      editor.commands.insertContent({ type: 'inlineMath', attrs: { latex: 'E=mc^2' } })
    },
  },
  {
    title: '區塊方程式',
    icon: '∑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      editor.commands.insertContent({ type: 'blockMath', attrs: { latex: '\\int_0^1 x^2 dx' } })
    },
  },
]

function getCompoundItems(): SlashItem[] {
  const { document } = useDocumentStore.getState()
  const blocks = document.theme.json.blocks ?? []
  return blocks.map(block => ({
    title: block.name,
    icon: block.icon,
    keywords: [block.key],
    command: ({ editor, range }: { editor: Editor; range: Range }) =>
      editor.chain().focus().deleteRange(range)
        .insertContent({
          type: 'compoundBlock',
          attrs: { key: block.key, class: block.class },
          content: [{ type: 'paragraph' }],
        }).run(),
  }))
}

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase()
  const allItems = [...slashItems, ...getCompoundItems()]
  if (!q) return allItems
  return allItems.filter(item => {
    const haystack = [item.title, ...(item.keywords ?? [])].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

function createMenuDom() {
  const root = document.createElement('div')
  root.className = 'slash-menu'
  const list = document.createElement('div')
  list.className = 'slash-menu-list'
  root.appendChild(list)
  document.body.appendChild(root)
  return { root, list }
}

function updateMenuPosition(
  root: HTMLDivElement,
  clientRect: (() => DOMRect | null) | null | undefined,
) {
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
  items: SlashItem[],
  selectedIndex: number,
  selectItem: (index: number) => void,
) {
  list.innerHTML = ''
  if (items.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'slash-menu-empty'
    empty.textContent = '沒有符合的指令'
    list.appendChild(empty)
    return
  }
  items.forEach((item, index) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`

    const icon = document.createElement('span')
    icon.className = 'slash-menu-icon'
    icon.textContent = item.icon

    const label = document.createElement('span')
    label.className = 'slash-menu-label'
    label.textContent = item.title

    const textContainer = document.createElement('div')
    textContainer.className = 'slash-menu-text-container'
    textContainer.appendChild(label)

    if (item.description) {
      const description = document.createElement('span')
      description.className = 'slash-menu-description'
      description.textContent = item.description
      textContainer.appendChild(description)
    }

    btn.appendChild(icon)
    btn.appendChild(textContainer)
    btn.addEventListener('mousedown', e => { e.preventDefault(); selectItem(index) })
    list.appendChild(btn)
  })
}

export const SlashCommand = Extension.create({
  name: 'slash-command',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        pluginKey: SlashCommandPluginKey,
        char: '/',
        allowSpaces: false,
        startOfLine: false,

        items: ({ query }) => filterItems(query),

        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },

        render: () => {
          let dom: ReturnType<typeof createMenuDom> | null = null
          let propsRef: SuggestionProps<SlashItem> | null = null
          let selectedIndex = 0

          const selectItem = (index: number) => {
            if (!propsRef) return
            const item = propsRef.items[index]
            if (!item) return
            propsRef.command(item)
            exitSuggestion(propsRef.editor.view, SlashCommandPluginKey)
          }

          return {
            onStart: (props) => {
              propsRef = props
              selectedIndex = 0
              dom = createMenuDom()
              renderItems(dom.list, props.items, selectedIndex, selectItem)
              updateMenuPosition(dom.root, props.clientRect)
            },

            onUpdate: (props) => {
              propsRef = props
              if (!dom) return
              if (selectedIndex >= props.items.length) selectedIndex = 0
              renderItems(dom.list, props.items, selectedIndex, selectItem)
              updateMenuPosition(dom.root, props.clientRect)
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (!propsRef || !dom) return false
              const count = propsRef.items.length

              if (props.event.key === 'ArrowDown') {
                props.event.preventDefault()
                if (count > 0) {
                  selectedIndex = (selectedIndex + 1) % count
                  renderItems(dom.list, propsRef.items, selectedIndex, selectItem)
                }
                return true
              }
              if (props.event.key === 'ArrowUp') {
                props.event.preventDefault()
                if (count > 0) {
                  selectedIndex = (selectedIndex - 1 + count) % count
                  renderItems(dom.list, propsRef.items, selectedIndex, selectItem)
                }
                return true
              }
              if (props.event.key === 'Enter') {
                props.event.preventDefault()
                selectItem(selectedIndex)
                return true
              }
              if (props.event.key === 'Escape') {
                props.event.preventDefault()
                if (propsRef) exitSuggestion(propsRef.editor.view, SlashCommandPluginKey)
                return true
              }
              return false
            },

            onExit: () => {
              dom?.root.remove()
              dom = null
              propsRef = null
              selectedIndex = 0
            },
          }
        },
      }),
    ]
  },
})