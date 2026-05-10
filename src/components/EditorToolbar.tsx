import { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="editor-toolbar">
      <button
        className="editor-toolbar-btn"
        onMouseDown={e => {
          e.preventDefault()
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}
        title="插入表格"
      >
        插入表格
      </button>
    </div>
  )
}