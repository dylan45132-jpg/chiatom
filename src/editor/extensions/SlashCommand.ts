import { Extension, type Range } from '@tiptap/core'
import Suggestion, {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion'
import { PluginKey } from 'prosemirror-state'
import type { Editor } from '@tiptap/react'
import { useDocumentStore } from '../../store/documentStore'
import { useLangStore } from '../../store/langStore'

const SlashCommandPluginKey = new PluginKey('slash-command')

type SlashItem = {
  title: string
  description?: string
  icon: string
  keywords?: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

function getSlashItems(): SlashItem[] {
  const t = useLangStore.getState().t

  return [
    {
      title: t.slashParagraph,
      icon: '¶',
      keywords: ['p', 'paragraph', 'text'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: t.slashH1,
      icon: 'H1',
      keywords: ['h1', 'heading1', 'title'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
    },
    {
      title: t.slashH2,
      icon: 'H2',
      keywords: ['h2', 'heading2'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
    },
    {
      title: t.slashH3,
      icon: 'H3',
      keywords: ['h3', 'heading3'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
    },
    {
      title: t.slashBullet,
      icon: '•',
      keywords: ['ul', 'bullet', 'list'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: t.slashOrdered,
      icon: '1.',
      keywords: ['ol', 'ordered', 'numbered'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: t.slashQuote,
      icon: '"',
      keywords: ['quote', 'blockquote'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: t.slashDivider,
      icon: '—',
      keywords: ['hr', 'divider', 'rule'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: t.slashTable,
      icon: '⊞',
      keywords: ['table', 'grid'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: t.slashImage,
      icon: '🖼',
      keywords: ['image', 'photo', 'picture'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range)
          .insertContent({ type: 'imagePlaceholder', attrs: {} }).run(),
    },
    {
      title: t.slashMathInline,
      icon: '∫',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        editor.commands.insertContent({ type: 'inlineMath', attrs: { latex: 'E=mc^2' } })
      },
    },
    {
      title: t.slashMathBlock,
      icon: '∑',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        editor.commands.insertContent({ type: 'blockMath', attrs: { latex: '\\int_0^1 x^2 dx' } })
      },
    },
{
  title: '兩欄並排（1:1）',
  description: '插入等寬兩欄',
  icon: '▥',
  keywords: ['兩欄', 'two column', 'columns', '並排', 'layout'],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'layoutBlock',
      attrs: { key: 'two-col-1-1', columns: '1fr 1fr' },
      content: [
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
      ],
    }).run()
  },
},
{
  title: '兩欄並排（2:3）',
  description: '插入左窄右寬兩欄',
  icon: '▦',
  keywords: ['兩欄', 'two column', 'columns', '並排', 'layout'],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'layoutBlock',
      attrs: { key: 'two-col-2-3', columns: '2fr 3fr' },
      content: [
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
      ],
    }).run()
  },
},
{
  title: '兩欄並排（3:2）',
  description: '插入左寬右窄兩欄',
  icon: '▧',
  keywords: ['兩欄', 'two column', 'columns', '並排', 'layout'],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'layoutBlock',
      attrs: { key: 'two-col-3-2', columns: '3fr 2fr' },
      content: [
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
        { type: 'columnSlot', content: [{ type: 'paragraph' }] },
      ],
    }).run()
  },
},

  ]
}

function getCompoundItems(): SlashItem[] {
  const { document } = useDocumentStore.getState()
  const blocks = document.theme.json.blocks ?? []
  return blocks.map(block => ({
    title: block.name,
    icon: block.icon,
    keywords: [block.key],
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      const children = (block.children ?? []).map(child => {
        if (child.type === 'ol') return { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] }
        if (child.type === 'ul') return { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] }
        if (child.type === 'imagePlaceholder') return { type: 'imagePlaceholder', attrs: { src: null } }
        if (child.type === 'h1') return { type: 'heading', attrs: { level: 1 }, content: [] }
        if (child.type === 'h2') return { type: 'heading', attrs: { level: 2 }, content: [] }
        if (child.type === 'label') return { type: 'paragraph', content: [] }
        return { type: 'paragraph', content: [] }
      })
      editor.chain().focus().deleteRange(range)
        .insertContent({
          type: 'compoundBlock',
          attrs: { key: block.key, class: block.class },
          content: children.length > 0 ? children : [{ type: 'paragraph' }],
        }).run()
    },
  }))
}

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase()
  const allItems = [...getSlashItems(), ...getCompoundItems()]
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
  const t = useLangStore.getState().t
  list.innerHTML = ''
  if (items.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'slash-menu-empty'
    empty.textContent = t.slashNoMatch
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
            const editor = propsRef.editor
            propsRef.command(item)
            if (editor) {
              exitSuggestion(editor.view, SlashCommandPluginKey)
            }
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
