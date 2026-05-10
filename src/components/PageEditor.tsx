import { useEditor, EditorContent } from '@tiptap/react'
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

// A4 @ 96dpi，扣掉 padding（上下各 72px）
const A4_CONTENT_HEIGHT = 1123 - 72 * 2

interface PageEditorProps {
  page: Page
}

export default function PageEditor({ page }: PageEditorProps) {
  const { updatePageContent, updatePageTitle } = useDocumentStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)
  const [mathModal, setMathModal] = useState<{
    isOpen: boolean
    initialLatex: string
    mode: 'inline' | 'block'
    pos: number
  }>({ isOpen: false, initialLatex: '', mode: 'inline', pos: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommand,
      Table.configure({ resizable: false }),
      ImagePlaceholder,
      CompoundBlock,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
        inlineOptions: {
          onClick: (node, pos) => {
            setMathModal({ isOpen: true, initialLatex: node.attrs.latex, mode: 'inline', pos })
          },
        },
        blockOptions: {
          onClick: (node, pos) => {
            setMathModal({ isOpen: true, initialLatex: node.attrs.latex, mode: 'block', pos })
          },
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return '輸入標題…'
          return '輸入內容，或按 / 插入區塊'
        },
        showOnlyCurrent: true,
      }),
    ],
    content: page.content,
    immediatelyRender: false,
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
            <span className="page-overflow-label">內容超出 A4 範圍</span>
          </div>
        )}
      </div>
      <MathModal
        isOpen={mathModal.isOpen}
        initialLatex={mathModal.initialLatex}
        mode={mathModal.mode}
        onConfirm={(latex) => {
          if (editor) {
            if (mathModal.mode === 'inline') {
              editor.chain().setNodeSelection(mathModal.pos).updateInlineMath({ latex }).focus().run()
            } else {
              editor.chain().setNodeSelection(mathModal.pos).updateBlockMath({ latex }).focus().run()
            }
          }
          setMathModal(prev => ({ ...prev, isOpen: false }))
        }}
        onClose={() => setMathModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}