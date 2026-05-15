import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLangStore } from '../store/langStore'
import { useProjectStore } from '../store/projectStore'
import { readHandoutMeta } from '../utils/handoutPackage'

interface PageOption {
  id: string
  title: string
}

interface Props {
  docId: string
  anchorX: number
  anchorY: number
  onClose: () => void
}

export default function AddToProjectFromFilePanel({ docId, anchorX, anchorY, onClose }: Props) {
  const { t } = useLangStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const { projects, addPageLink, getLinksForPage } = useProjectStore()
  const [pages, setPages] = useState<PageOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    readHandoutMeta(docId).then(meta => {
      if (!meta) return
      const opts = meta.pages.map(p => ({ id: p.id, title: p.title }))
      setPages(opts)
      setSelected(new Set(opts.map(p => p.id)))
      setLoading(false)
    })
  }, [docId])

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const togglePage = (pageId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) next.delete(pageId)
      else next.add(pageId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === pages.length) setSelected(new Set())
    else setSelected(new Set(pages.map(p => p.id)))
  }

  const handleConfirm = async () => {
    if (!selectedProject || selected.size === 0) return
    await Promise.all(
      pages
        .filter(p => selected.has(p.id))
        .map(p => addPageLink(selectedProject, { docId, pageId: p.id, role: '' }))
    )
    onClose()
  }

  const allSelected = selected.size === pages.length && pages.length > 0

  return createPortal(
    <div
      ref={panelRef}
      className='zotero-project-panel'
      style={{ position: 'fixed', left: anchorX, top: anchorY, zIndex: 9999, minWidth: 260 }}
    >
      <div className='zotero-panel-section-label'>{t.zoteroAddToProject}</div>

      <select
        className='zotero-panel-select'
        value={selectedProject}
        onChange={e => setSelectedProject(e.target.value)}
      >
        <option value=''>{t.zoteroSelectProject}</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className='zotero-panel-divider' />

      {loading ? (
        <div className='zotero-panel-empty'>...</div>
      ) : (
        <>
          <div className='zotero-panel-linked-item' style={{ cursor: 'pointer' }} onClick={toggleAll}>
            <input type='checkbox' checked={allSelected} onChange={toggleAll} onClick={e => e.stopPropagation()} />
            <span className='zotero-panel-linked-name'>{allSelected ? t.cancel : t.confirm} {t.pages}</span>
          </div>
          <div className='zotero-panel-divider' />
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {pages.map(page => {
              const alreadyLinked = getLinksForPage(docId, page.id).find(l => l.project.id === selectedProject)
              return (
                <div
                  key={page.id}
                  className='zotero-panel-linked-item'
                  style={{ cursor: alreadyLinked ? 'default' : 'pointer', opacity: alreadyLinked ? 0.4 : 1 }}
                  onClick={() => !alreadyLinked && togglePage(page.id)}
                >
                  <input
                    type='checkbox'
                    checked={selected.has(page.id)}
                    disabled={!!alreadyLinked}
                    onChange={() => !alreadyLinked && togglePage(page.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className='zotero-panel-linked-name'>{page.title}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className='zotero-panel-divider' />
      <div className='zotero-panel-actions'>
        <button className='zotero-panel-btn-cancel' onClick={onClose}>{t.cancel}</button>
        <button
          className='zotero-panel-btn-confirm'
          onClick={handleConfirm}
          disabled={!selectedProject || selected.size === 0}
        >
          {t.confirm}
        </button>
      </div>
    </div>,
    document.body
  )
}