import { useProjectStore } from '../store/projectStore'
import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageContextMenu, { usePageContextMenu } from './PageContextMenu'
import { useLangStore } from '../store/langStore'

const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 360
const SIDEBAR_DEFAULT = 220

interface PageItemProps {
  id: string
  title: string
  isActive: boolean
  isRenaming: boolean
  projectNames?: string[]
  onClick: () => void
  onDelete: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onRenameSubmit: (id: string, newTitle: string) => void
  onRenameCancel: () => void
}

function PageItem({
  id, title, isActive, isRenaming, projectNames,
  onClick, onDelete, onContextMenu,
  onRenameSubmit, onRenameCancel,
}: PageItemProps) {
  const { t } = useLangStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }, [isRenaming])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value.trim()
      onRenameSubmit(id, val || title)
    } else if (e.key === 'Escape') {
      onRenameCancel()
    }
  }

  const handleInputBlur = () => {
    const val = inputRef.current?.value.trim()
    onRenameSubmit(id, val || title)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sidebar-page-item ${isActive ? 'is-active' : ''}`}
      onClick={isRenaming ? undefined : onClick}
      onContextMenu={isRenaming ? undefined : onContextMenu}
    >
      {isRenaming ? (
        <input
          ref={inputRef}
          className='sidebar-rename-input'
          defaultValue={title}
          autoFocus
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <>
          <span
            className='sidebar-drag-handle'
            {...attributes}
            {...listeners}
            title={t.dragToSort}
          >
            ⠿
          </span>
                    <span className='sidebar-page-title'>{title}</span>
          {projectNames && projectNames.length > 0 && (
            <span
              className='sidebar-project-dot'
              title={projectNames.join(', ')}
            />
          )}
          <button
            className='sidebar-delete-btn'
            onClick={e => { e.stopPropagation(); onDelete() }}
            title={t.deletePage}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { getLinksForPage } = useProjectStore()
  const { t } = useLangStore()
  const {
    document,
    activePageId,
    savePath,
    setActivePage,
    addPage,
    deletePage,
    reorderPages,
    updatePageTitle,
  } = useDocumentStore()

  const { menu, openMenu, closeMenu } = usePageContextMenu()

  // ── Resize ──────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [collapsed, setCollapsed] = useState(false)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const delta = ev.clientX - startX.current
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + delta))
      setSidebarWidth(newWidth)
    }
    const onMouseUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // ── Rename ──────────────────────────────
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const handleRenameStart = (pageId: string) => {
    setRenamingId(pageId)
  }

  const handleRenameSubmit = (id: string, newTitle: string) => {
    updatePageTitle(id, newTitle)
    setRenamingId(null)
  }

  const handleRenameCancel = () => {
    setRenamingId(null)
  }

  // ── DnD ─────────────────────────────────
  const pages = document.pages
  const pageIds = pages.map(p => p.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = pages.findIndex(p => p.id === active.id)
    const toIndex = pages.findIndex(p => p.id === over.id)
    reorderPages(fromIndex, toIndex)
  }

  // ── Render ───────────────────────────────
  return (
    <>
      <div
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ width: collapsed ? 0 : sidebarWidth }}
      >
        {!collapsed && (
          <>
            <div className='sidebar-header'>
              <span className='sidebar-label'>{t.pages}</span>
              <button className='sidebar-add-btn' onClick={addPage} title={t.addPage}>
                +
              </button>
            </div>

            <div className='sidebar-pages'>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
                  {pages.map(page => (
                    <PageItem
                      key={page.id}
                      id={page.id}
                      title={page.title}
                      isActive={page.id === activePageId}
                      isRenaming={page.id === renamingId}
                      onClick={() => setActivePage(page.id)}
                      onDelete={() => deletePage(page.id)}
                      onContextMenu={e => openMenu(e, page.id)}
                      onRenameSubmit={handleRenameSubmit}
                                            onRenameCancel={handleRenameCancel}
                      projectNames={getLinksForPage(savePath ?? document.id, page.id).map(l => l.project.name)}

                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </>
        )}

        {!collapsed && (
          <div
            className='sidebar-resize-handle'
            onMouseDown={handleResizeMouseDown}
          />
        )}
      </div>

      <button
        className='sidebar-toggle-btn'
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        style={{ left: collapsed ? 0 : sidebarWidth }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <PageContextMenu menu={menu} onClose={closeMenu} onRename={handleRenameStart} docId={savePath ?? document.id} />
    </>
  )
}