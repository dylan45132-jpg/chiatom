import { useEditor, EditorContent } from '@tiptap/react'
import { Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useDocumentStore, Page } from '../store/documentStore'
import { useEffect, useRef, useState } from 'react'
import { Table } from '@tiptap/extension-table/table'
import { TableRow } from '@tiptap/extension-table/row'
import { TableHeader } from '@tiptap/extension-table/header'
import { TableCell } from '@tiptap/extension-table/cell'
import BubbleToolbar from './BubbleToolbar'
import { SlashCommand } from '../editor/extensions/SlashCommand'
import { ImagePlaceholder } from '../editor/extensions/ImagePlaceholder'
import { CompoundBlock } from '../editor/extensions/CompoundBlock'
import { Mathematics } from '@tiptap/extension-mathematics'
import 'katex/dist/katex.min.css'
import { MathModal } from './MathModal'
import { useLangStore } from '../store/langStore'
import TextAlign from '@tiptap/extension-text-align'
import { getEnabledExtensions } from '../plugins/registry'
import { getSettings } from '../store/settingsStore'

const suppressMathScrollKey = new PluginKey<boolean>('suppress-math-scroll')

const suppressMathScrollPlugin = new Plugin({
  key: suppressMathScrollKey,
  state: {
    init: () => false,
    apply(tr: Transaction) {
      return tr.getMeta(suppressMathScrollKey) === true
    },
  },
})

// A4 @ 96dpi，扣掉 padding（上下各 72px）
const A4_CONTENT_HEIGHT = 1123 - 72 * 2

interface PageEditorProps {
  page: Page
}

export default function PageEditor({ page }: PageEditorProps) {
  const { t } = useLangStore()
  const { updatePageContent, updatePageTitle } = useDocumentStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)
  const [mathModal, setMathModal] = useState<{
    isOpen: boolean
    initialLatex: string
    mode: 'inline' | 'block'
    pos: number
    clientX: number
    clientY: number
  }>({ isOpen: false, initialLatex: '', mode: 'inline', pos: 0, clientX: 0, clientY: 0 })

  const enabledExtensions = getEnabledExtensions(getSettings().enabledPlugins)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      SlashCommand,
      Table.configure({ resizable: true }),
      ImagePlaceholder,
      CompoundBlock,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) => {
          const { t } = useLangStore.getState()
          if (node.type.name === 'heading') return t.placeholderHeading
          return t.placeholderDefault
        },
        showOnlyCurrent: true,
      }),
      ...enabledExtensions,
    ],
    content: page.content,
    immediatelyRender: false,
    editorProps: {
      handleScrollToSelection(view) {
        return suppressMathScrollKey.getState(view.state) === true
      },
      handleClickOn(_view, _pos, node, nodePos, event) {
        if (node.type.name === 'inlineMath' || node.type.name === 'blockMath') {
          const scrollEl = document.querySelector('.canvas-scroll')
          const scrollTop = scrollEl?.scrollTop ?? 0
          const clientX = event?.clientX ?? window.innerWidth / 2
          const clientY = event?.clientY ?? window.innerHeight / 2
          const mode = node.type.name === 'inlineMath' ? 'inline' : 'block'

          setMathModal({
            isOpen: true,
            initialLatex: node.attrs.latex,
            mode,
            pos: nodePos,
            clientX,
            clientY,
          })

          requestAnimationFrame(() => {
            if (scrollEl) (scrollEl as HTMLElement).scrollTop = scrollTop
          })
          return true // Prevent default click behavior
        }
        return false
      },
    },
    onCreate({ editor }) {
      editor.registerPlugin(suppressMathScrollPlugin)
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      updatePageContent(page.id, json)

      // 自動更新左側面板標題（取第一個 h1）
      const firstNode = json.content?.[0]
      if (firstNode?.type === 'heading' && firstNode.attrs?.level === 1) {
        const text = (firstNode.content?.[0] as any)?.text ?? ''
        if (text) updatePageTitle(page.id, text)
      }
    },
  })

  // 切換頁面時同步內容
  useEffect(() => {
    if (editor && editor.getJSON() !== page.content) {
      editor.commands.setContent(page.content, { emitUpdate: false })
    }
  }, [page.id])

  // 監測內容高度，偵測溢出
  useEffect(() => {
    if (!editorRef.current) return

    const proseMirror = editorRef.current.querySelector('.ProseMirror')
    if (!proseMirror) return

    const observer = new ResizeObserver(() => {
      const height = proseMirror.scrollHeight
      setIsOverflow(height > A4_CONTENT_HEIGHT)
    })

    observer.observe(proseMirror)
    return () => observer.disconnect()
  }, [editor])

  return (
    <div className="page-wrapper">
      {editor && <BubbleToolbar editor={editor} />}
      <div className={`page ${isOverflow ? 'page-overflow' : ''}`}>
        <div ref={editorRef}>
          <EditorContent editor={editor} />
        </div>
        {isOverflow && (
          <div className="page-overflow-warning">
            <div className="page-overflow-line" />
            <span className="page-overflow-label">{t.overflowLabel}</span>
          </div>
        )}
      </div>
      <MathModal
        isOpen={mathModal.isOpen}
        initialLatex={mathModal.initialLatex}
        mode={mathModal.mode}
        clientX={mathModal.clientX}
        clientY={mathModal.clientY}
        onConfirm={(latex) => {
          if (editor) {
            if (mathModal.mode === 'inline') {
              editor.chain().setNodeSelection(mathModal.pos).updateInlineMath({ latex }).run()
            } else {
              editor.chain().setNodeSelection(mathModal.pos).updateBlockMath({ latex }).run()
            }
            const suppressTr = editor.state.tr.setMeta(suppressMathScrollKey, true)
            editor.view.dispatch(suppressTr)
            ;(editor.view.dom as HTMLElement).focus({ preventScroll: true })
          }
          setMathModal(prev => ({ ...prev, isOpen: false }))
        }}
        onClose={() => setMathModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
