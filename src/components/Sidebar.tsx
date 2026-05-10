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

// ── 單一頁面項目 ──────────────────────────

interface PageItemProps {
  id: string
  title: string
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function PageItem({ id, title, isActive, onClick, onDelete, onContextMenu }: PageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sidebar-page-item ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <span
        className="sidebar-drag-handle"
        {...attributes}
        {...listeners}
        title="拖曳排序"
      >
        ⠿
      </span>
      <span className="sidebar-page-title">{title}</span>
      <button
        className="sidebar-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete() }}
        title="刪除頁面"
      >
        ×
      </button>
    </div>
  )
}

// ── Sidebar 主體 ──────────────────────────

export default function Sidebar() {
  const {
    document,
    activePageId,
    setActivePage,
    addPage,
    deletePage,
    reorderPages,
  } = useDocumentStore()

  const { menu, openMenu, closeMenu } = usePageContextMenu()

  const pages = document.pages
  const pageIds = pages.map(p => p.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = pages.findIndex(p => p.id === active.id)
    const toIndex = pages.findIndex(p => p.id === over.id)
    reorderPages(fromIndex, toIndex)
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-label">頁面</span>
          <button className="sidebar-add-btn" onClick={addPage} title="新增頁面">
            +
          </button>
        </div>

        <div className="sidebar-pages">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
              {pages.map(page => (
                <PageItem
                  key={page.id}
                  id={page.id}
                  title={page.title}
                  isActive={page.id === activePageId}
                  onClick={() => setActivePage(page.id)}
                  onDelete={() => deletePage(page.id)}
                  onContextMenu={e => openMenu(e, page.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <PageContextMenu menu={menu} onClose={closeMenu} />
    </>
  )
}