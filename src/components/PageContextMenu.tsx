import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { toast } from '../store/toastStore'
import { useLangStore } from '../store/langStore'
import { useProjectStore } from '../store/projectStore'
import AddToProjectPanel from './AddToProjectPanel'

const GAP = 8

interface MenuState {
  open: boolean
  x: number
  y: number
  pageId: string
}

const CLOSED: MenuState = { open: false, x: 0, y: 0, pageId: '' }

export function usePageContextMenu() {
  const [menu, setMenu] = useState<MenuState>(CLOSED)
  const openMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault()
    setMenu({ open: true, x: e.clientX, y: e.clientY, pageId })
  }
  const closeMenu = () => setMenu(CLOSED)
  return { menu, openMenu, closeMenu }
}

interface PageContextMenuProps {
  menu: MenuState
  onClose: () => void
  onRename?: (pageId: string) => void
  docId: string
}

export default function PageContextMenu({ menu, onClose, onRename, docId }: PageContextMenuProps) {
  const { t } = useLangStore()
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: menu.x, y: menu.y })
  const { document, deletePage, duplicatePage, updatePageVerticalAlign } = useDocumentStore()
  const { getLinksForPage } = useProjectStore()
  const linkedProjects = getLinksForPage(docId, menu.pageId)
  const [showProjectPanel, setShowProjectPanel] = useState(false)

  useLayoutEffect(() => {
    if (!menu.open || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let x = menu.x
    let y = menu.y
    if (rect.right > window.innerWidth - GAP) x = Math.max(GAP, window.innerWidth - rect.width - GAP)
    if (rect.bottom > window.innerHeight - GAP) y = Math.max(GAP, window.innerHeight - rect.height - GAP)
    setPos({ x, y })
  }, [menu.open, menu.x, menu.y])

  useEffect(() => {
    if (!menu.open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest?.('.zotero-project-panel')
      ) onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
  const isPresentation = document?.mode === 'presentation'
  const currentPage = pages[index]

  const handleInsertBefore = () => {
    const newPage = { id: crypto.randomUUID(), title: `${t.pageTitle} ${pages.length + 1}`, content: { type: 'doc' as const, content: [{ type: 'paragraph' }] } }
    useDocumentStore.setState(state => ({
      document: { ...state.document, pages: [...state.document.pages.slice(0, index), newPage, ...state.document.pages.slice(index)], updatedAt: new Date().toISOString() },
      activePageId: newPage.id,
    }))
    onClose()
  }

  const handleInsertAfter = () => {
    const newPage = { id: crypto.randomUUID(), title: `${t.pageTitle} ${pages.length + 1}`, content: { type: 'doc' as const, content: [{ type: 'paragraph' }] } }
    useDocumentStore.setState(state => ({
      document: { ...state.document, pages: [...state.document.pages.slice(0, index + 1), newPage, ...state.document.pages.slice(index + 1)], updatedAt: new Date().toISOString() },
      activePageId: newPage.id,
    }))
    onClose()
  }

  const handleDuplicate = () => { duplicatePage(menu.pageId); toast.success(t.toastDuplicated); onClose() }
  const handleDelete = () => { deletePage(menu.pageId); toast.info(t.toastDeleted); onClose() }
  const handleRename = () => { onRename?.(menu.pageId); onClose() }
  const handleAlignTop = () => { updatePageVerticalAlign(menu.pageId, 'top'); onClose() }
  const handleAlignCenter = () => { updatePageVerticalAlign(menu.pageId, 'center'); onClose() }
  const handleAlignBottom = () => { updatePageVerticalAlign(menu.pageId, 'bottom'); onClose() }


  return (
    <>
      <div ref={menuRef} className='context-menu' style={{ left: pos.x, top: pos.y }}>
        <button className='context-menu-item' onClick={handleRename}>{t.renamePage}</button>

{isPresentation && (
  <>
    <div className='context-menu-divider' />
    <div className='context-menu-label'>垂直對齊</div>
    <button
      className={`context-menu-item ${currentPage?.verticalAlign === 'top' || !currentPage?.verticalAlign ? 'context-menu-item--active' : ''}`}
      onClick={handleAlignTop}
    >頂部對齊</button>
    <button
      className={`context-menu-item ${currentPage?.verticalAlign === 'center' ? 'context-menu-item--active' : ''}`}
      onClick={handleAlignCenter}
    >垂直置中</button>
    <button
      className={`context-menu-item ${currentPage?.verticalAlign === 'bottom' ? 'context-menu-item--active' : ''}`}
      onClick={handleAlignBottom}
    >底部對齊</button>
  </>
)}

        <div className='context-menu-divider' />
        <button className='context-menu-item' onClick={() => setShowProjectPanel(true)}>
          {t.zoteroAddToProject}
          {linkedProjects.length > 0 && <span className='context-menu-badge'>{linkedProjects.length}</span>}
        </button>
        <div className='context-menu-divider' />
        <button className='context-menu-item' onClick={handleInsertBefore}>{t.insertAbove}</button>
        <button className='context-menu-item' onClick={handleInsertAfter}>{t.insertBelow}</button>
        <div className='context-menu-divider' />
        <button className='context-menu-item' onClick={handleDuplicate}>{t.duplicatePage}</button>
        <div className='context-menu-divider' />
        <button className='context-menu-item context-menu-danger' onClick={handleDelete}>{t.deletePageMenu}</button>
      </div>
      {showProjectPanel && (
        <AddToProjectPanel
          docId={docId}
          pageId={menu.pageId}
          anchorX={pos.x + 200}
          anchorY={pos.y}
          onClose={() => setShowProjectPanel(false)}
        />
      )}
    </>
  )
}