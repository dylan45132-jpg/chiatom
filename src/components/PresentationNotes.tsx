import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentStore } from '../store/documentStore'
import { useNavigationStore } from '../store/navigationStore'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Mathematics } from '@tiptap/extension-mathematics'
import 'katex/dist/katex.min.css'
import { ImagePlaceholder } from '../editor/extensions/ImagePlaceholder'

export default function PresentationNotes() {
  const { document: doc, updateSpeakerNotes } = useDocumentStore()
  const { currentView } = useNavigationStore()
  const [collapsed, setCollapsed] = useState(false)
  const [size, setSize] = useState({ width: 340, height: 280 })
  const [closed, setClosed] = useState(false)
  const [pos, setPos] = useState({
    x: window.innerWidth - 380,
    y: 80,
  })
  const dragging = useRef(false)
  const resizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const notesEditor = useEditor({
    extensions: [StarterKit, Mathematics, ImagePlaceholder],
    content: doc.speakerNotes ?? { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      updateSpeakerNotes(editor.getJSON())
    },
  })

  useEffect(() => {
    if (!notesEditor) return
    if (!doc.speakerNotes) return
    const current = notesEditor.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(doc.speakerNotes)) {
      setTimeout(() => {
        if (doc.speakerNotes) {
          notesEditor.commands.setContent(doc.speakerNotes)
        }
      }, 0)
    }
  }, [notesEditor, doc.speakerNotes])

  useEffect(() => {
    setClosed(false)
  }, [doc?.id])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height }
    e.preventDefault()
    e.stopPropagation()
  }, [size])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging.current) {
      setPos({
        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - 360),
        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - 100),
      })
    }
    if (resizing.current) {
      const newW = Math.max(240, resizeStart.current.w + (e.clientX - resizeStart.current.x))
      const newH = Math.max(160, resizeStart.current.h + (e.clientY - resizeStart.current.y))
      setSize({ width: newW, height: newH })
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    dragging.current = false
    resizing.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (currentView !== 'editor' || doc.mode !== 'presentation') return null

  if (closed) return createPortal(
    <button
      className="presentation-notes-reopen"
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
      onClick={() => setClosed(false)}
    >
      Notes
    </button>,
    document.body
  )

  return createPortal(
    <div
      className="presentation-notes-panel"
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 1000, width: size.width }}
      onClick={e => e.stopPropagation()}
    >
      <div className="presentation-notes-header" onMouseDown={handleMouseDown}>
        <span className="presentation-notes-title">Notes</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="presentation-notes-toggle" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '▾' : '▴'}
          </button>
          <button className="presentation-notes-toggle" onClick={() => setClosed(true)}>
            ×
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <EditorContent
            editor={notesEditor}
            className="presentation-notes-textarea"
            style={{ height: collapsed ? 0 : size.height }}
          />
          <div
            className="presentation-notes-resize"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>,
    document.body
  )
}
