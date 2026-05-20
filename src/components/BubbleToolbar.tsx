import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { useLangStore } from '../store/langStore'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react'

interface BubbleToolbarProps {
  editor: Editor
}

interface ToolbarPos {
  x: number
  y: number
  mode: 'text' | 'table' | 'image' | 'slot' | null
}

 export default function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const { t } = useLangStore()
  const [pos, setPos] = useState<ToolbarPos>({ x: 0, y: 0, mode: null })
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [finalPos, setFinalPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const update = () => {
      const { state, view } = editor
      const { selection } = state

      if (editor.isActive('imagePlaceholder')) {
        const coords = view.coordsAtPos(selection.from)
        setPos({
          x: coords.left,
          y: coords.top - 48,
          mode: 'image',
        })
        return
      }

      if (editor.isActive('columnSlot') && !selection.empty) {
        const coords = view.coordsAtPos(selection.from)
        const endCoords = view.coordsAtPos(selection.to)
        const x = (coords.left + endCoords.left) / 2
        setPos({
          x,
          y: coords.top - 48,
          mode: 'slot',
        })
        return
      }

      if (editor.isActive('table')) {
        const coords = view.coordsAtPos(selection.from)
        setPos({
          x: coords.left,
          y: coords.top - 48,
          mode: 'table',
        })
        return
      }

      if (!selection.empty) {
        const coords = view.coordsAtPos(selection.from)
        const endCoords = view.coordsAtPos(selection.to)
        const x = (coords.left + endCoords.left) / 2
        setPos({
          x,
          y: coords.top - 48,
          mode: 'text',
        })
        return
      }

      setPos({ x: 0, y: 0, mode: null })
    }

    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', () => setPos({ x: 0, y: 0, mode: null }))

    return () => {
      editor.off('selectionUpdate', update)
    }
  }, [editor])

  // 位置修正：避免超出視窗
  useEffect(() => {
    if (!pos.mode || !toolbarRef.current) return
    const rect = toolbarRef.current.getBoundingClientRect()
    let x = pos.x - rect.width / 2
    const y = pos.y

    if (x < 8) x = 8
    if (x + rect.width > window.innerWidth - 8)
      x = window.innerWidth - rect.width - 8

    setFinalPos({ x, y })
  }, [pos])

  if (!pos.mode) return null

  return createPortal(
    <div ref={toolbarRef} className="bubble-menu" style={{ position: 'fixed', zIndex: 8000, left: finalPos.x, top: finalPos.y }}>
      {pos.mode === 'text' && (
  <>
    <button
      className={editor.isActive('paragraph') && !editor.isActive('heading') ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().setParagraph().run() }}
      title='段落'
    >P</button>
    <button
      className={editor.isActive('heading', { level: 1 }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
      title='標題 1'
    >H1</button>
    <button
      className={editor.isActive('heading', { level: 2 }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
      title='標題 2'
    >H2</button>
    <button
      className={editor.isActive('heading', { level: 3 }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
      title='標題 3'
    >H3</button>
    <div className='bubble-divider' />
    <button
      className={`bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
      title={t.bold}
    >B</button>
    <button
      className={`bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
      title={t.italic}
    >I</button>
    <button
      className={`bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
      title={t.strike}
    >S</button>
    <div className='bubble-divider' />
    <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('14px').run() }} title="小字">S</button>
    <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).unsetFontSize().run() }} title="預設大小">M</button>
    <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('24px').run() }} title="大字">L</button>
    <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('32px').run() }} title="特大字">XL</button>
    <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('48px').run() }} title="超大字">XXL</button>
    <div className='bubble-divider' />
    <button
      className={editor.isActive({ textAlign: 'left' }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }}
      title={t.alignLeft}
    ><AlignLeft size={13} /></button>
    <button
      className={editor.isActive({ textAlign: 'center' }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }}
      title={t.alignCenter}
    ><AlignCenter size={13} /></button>
    <button
      className={editor.isActive({ textAlign: 'right' }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }}
      title={t.alignRight}
    ><AlignRight size={13} /></button>
    <button
      className={editor.isActive({ textAlign: 'justify' }) ? 'bubble-btn is-active' : 'bubble-btn'}
      onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run() }}
      title={t.alignJustify}
    ><AlignJustify size={13} /></button>
  </>
)}

      {pos.mode === 'table' && (
        <>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnBefore().run() }} title={t.addColBefore}>{t.colLeft}</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnAfter().run() }} title={t.addColAfter}>{t.colRight}</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteColumn().run() }} title={t.deleteCol}>{t.deleteCol}</button>
          <div className="bubble-divider" />
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowBefore().run() }} title={t.addRowBefore}>{t.rowUp}</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowAfter().run() }} title={t.addRowAfter}>{t.rowDown}</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteRow().run() }} title={t.deleteRow}>{t.deleteRow}</button>
          <div className="bubble-divider" />
          <button className="bubble-btn bubble-btn-danger" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteTable().run() }} title={t.deleteTable}>{t.deleteTable}</button>
        </>
      )}

      {pos.mode === 'image' && (
        <>
          <button
            className={`bubble-btn ${editor.getAttributes('imagePlaceholder').align === 'left' || !editor.getAttributes('imagePlaceholder').align ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('imagePlaceholder', { align: 'left' }).run() }}
            title="靠左"
          ><AlignLeft size={13} /></button>
          <button
            className={`bubble-btn ${editor.getAttributes('imagePlaceholder').align === 'center' ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('imagePlaceholder', { align: 'center' }).run() }}
            title="置中"
          ><AlignCenter size={13} /></button>
          <button
            className={`bubble-btn ${editor.getAttributes('imagePlaceholder').align === 'right' ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('imagePlaceholder', { align: 'right' }).run() }}
            title="靠右"
          ><AlignRight size={13} /></button>
        </>
      )}

      {pos.mode === 'slot' && (
        <>
          <button
            className={`bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
            title={t.bold}
          >B</button>
          <button
            className={`bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
            title={t.italic}
          >I</button>
          <button
            className={`bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
            title={t.strike}
          >S</button>
          <div className='bubble-divider' />
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('14px').run() }} title="小字">S</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).unsetFontSize().run() }} title="預設大小">M</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('24px').run() }} title="大字">L</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('32px').run() }} title="特大字">XL</button>
          <button className="bubble-btn" onMouseDown={e => { e.preventDefault(); (editor.chain().focus() as any).setFontSize('48px').run() }} title="超大字">XXL</button>
          <div className='bubble-divider' />
          <button
            className={`bubble-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }}
            title={t.alignLeft}
          ><AlignLeft size={13} /></button>
          <button
            className={`bubble-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }}
            title={t.alignCenter}
          ><AlignCenter size={13} /></button>
          <button
            className={`bubble-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }}
            title={t.alignRight}
          ><AlignRight size={13} /></button>
          <div className='bubble-divider' />
          <button
            className={`bubble-btn ${editor.getAttributes('columnSlot').verticalAlign === 'top' || !editor.getAttributes('columnSlot').verticalAlign ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('columnSlot', { verticalAlign: 'top' }).run() }}
            title="頂部對齊"
          ><AlignVerticalJustifyStart size={13} /></button>
          <button
            className={`bubble-btn ${editor.getAttributes('columnSlot').verticalAlign === 'center' ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('columnSlot', { verticalAlign: 'center' }).run() }}
            title="垂直置中"
          ><AlignVerticalJustifyCenter size={13} /></button>
          <button
            className={`bubble-btn ${editor.getAttributes('columnSlot').verticalAlign === 'bottom' ? 'is-active' : ''}`}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().updateAttributes('columnSlot', { verticalAlign: 'bottom' }).run() }}
            title="底部對齊"
          ><AlignVerticalJustifyEnd size={13} /></button>
        </>
      )}
    </div>,
    document.body
  )
}
