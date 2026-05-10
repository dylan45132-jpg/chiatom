import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { toast } from '../store/toastStore'
import { useLangStore } from '../store/langStore'

const GAP = 8

interface MenuState {
  open: boolean
  x: number
  y: number
  pageId: string
}

const CLOSED: MenuState = { open: false, x: 0, y: 0, pageId: '' }

// ── Hook：供 Sidebar 使用 ─────────────────

export function usePageContextMenu() {
  const [menu, setMenu] = useState<MenuState>(CLOSED)

  const openMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault()
    setMenu({ open: true, x: e.clientX, y: e.clientY, pageId })
  }

  const closeMenu = () => setMenu(CLOSED)

  return { menu, openMenu, closeMenu }
}

// ── Context Menu 元件 ─────────────────────

interface PageContextMenuProps {
  menu: MenuState
  onClose: () => void
}

export default function PageContextMenu({ menu, onClose }: PageContextMenuProps) {
  const { t } = useLangStore()
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: menu.x, y: menu.y })

  const {
    document,
    deletePage,
    duplicatePage,
  } = useDocumentStore()

  // 位置修正：避免超出視窗
  useLayoutEffect(() => {
    if (!menu.open || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let x = menu.x
    let y = menu.y
    if (rect.right > window.innerWidth - GAP)
      x = Math.max(GAP, window.innerWidth - rect.width - GAP)
    if (rect.bottom > window.innerHeight - GAP)
      y = Math.max(GAP, window.innerHeight - rect.height - GAP)
    setPos({ x, y })
  }, [menu.open, menu.x, menu.y])

  // 外部點擊 / Escape 關閉
  useEffect(() => {
    if (!menu.open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menu.open])

  if (!menu.open) return null

  const pages = document.pages
  const index = pages.findIndex(p => p.id === menu.pageId)

  const handleInsertBefore = () => {
    const newPage = { id: crypto.randomUUID(), title: `${t.pageTitle} ${pages.length + 1}`, content: { type: 'doc' as const, content: [{ type: 'paragraph' }] } }
    useDocumentStore.setState(state => ({
      document: {
        ...state.document,
        pages: [
          ...state.document.pages.slice(0, index),
          newPage,
          ...state.document.pages.slice(index),
        ],
        updatedAt: new Date().toISOString(),
      },
      activePageId: newPage.id,
    }))
    onClose()
  }

  const handleInsertAfter = () => {
    const newPage = { id: crypto.randomUUID(), title: `${t.pageTitle} ${pages.length + 1}`, content: { type: 'doc' as const, content: [{ type: 'paragraph' }] } }
    useDocumentStore.setState(state => ({
      document: {
        ...state.document,
        pages: [
          ...state.document.pages.slice(0, index + 1),
          newPage,
          ...state.document.pages.slice(index + 1),
        ],
        updatedAt: new Date().toISOString(),
      },
      activePageId: newPage.id,
    }))
    onClose()
  }

  const handleDuplicate = () => {
    duplicatePage(menu.pageId)
    toast.success(t.toastDuplicated)
    onClose()
  }

  const handleDelete = () => {
    deletePage(menu.pageId)
    toast.info(t.toastDeleted)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: pos.x, top: pos.y }}
    >
      <button className="context-menu-item" onClick={handleInsertBefore}>
        {t.insertAbove}
      </button>
      <button className="context-menu-item" onClick={handleInsertAfter}>
        {t.insertBelow}
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" onClick={handleDuplicate}>
        {t.duplicatePage}
      </button>
      <div className="context-menu-divider" />
      <button
        className="context-menu-item context-menu-danger"
        onClick={handleDelete}
      >
        {t.deletePageMenu}
      </button>
    </div>
  )
}
