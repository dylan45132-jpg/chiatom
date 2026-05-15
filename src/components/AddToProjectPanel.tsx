import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLangStore } from '../store/langStore'
import { useProjectStore } from '../store/projectStore'
import { usePluginStore } from '../store/pluginStore'

interface Props {
  docId: string
  pageId: string
  anchorX: number
  anchorY: number
  onClose: () => void
}

export default function AddToProjectPanel({ docId, pageId, anchorX, anchorY, onClose }: Props) {
  const { t } = useLangStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: anchorX, y: anchorY })
  const { projects, customRoles, addPageLink, removePageLink, updatePageLink, getLinksForPage, addCustomRole } = useProjectStore()
  const { isEnabled } = usePluginStore()
  const zoteroEnabled = isEnabled('zotero')

  const academicRoles = zoteroEnabled ? [
    t.zoteroRoleTheory,
    t.zoteroRoleMethod,
    t.zoteroRoleData,
    t.zoteroRoleResult,
    t.zoteroRoleBackground,
    t.zoteroRoleCritique,
  ] : []

  const linkedProjects = getLinksForPage(docId, pageId)
  const [selectedProject, setSelectedProject] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [note, setNote] = useState('')

  useLayoutEffect(() => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    let x = anchorX
    let y = anchorY
    if (rect.right > window.innerWidth - 8) x = Math.max(8, window.innerWidth - rect.width - 8)
    if (rect.bottom > window.innerHeight - 8) y = Math.max(8, window.innerHeight - rect.height - 8)
    setPos({ x, y })
  }, [anchorX, anchorY])

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

  const handleAdd = async () => {
    if (!selectedProject) return
    const role = roleInput.trim()
    if (role && !customRoles.includes(role)) await addCustomRole(role)
    await addPageLink(selectedProject, { docId, pageId, role, note: note.trim() || undefined })
    setSelectedProject('')
    setRoleInput('')
    setNote('')
  }

  const roleListId = `role-datalist-${docId}-${pageId}`

  return createPortal(
    <div ref={panelRef} className='zotero-project-panel' style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}>
      <div className='zotero-panel-section-label'>{t.zoteroLinkedProjects}</div>
      {linkedProjects.length === 0 ? (
        <div className='zotero-panel-empty'>{t.zoteroNoLinkedProjects}</div>
      ) : (
        <div className='zotero-panel-linked-list'>
          {linkedProjects.map(({ project, link }) => (
            <div key={project.id} className='zotero-panel-linked-item'>
              <span className='zotero-panel-linked-name'>{project.name}</span>
              <input
                className='zotero-panel-input'
                defaultValue={link.role}
                onBlur={e => updatePageLink(project.id, docId, pageId, { role: e.target.value })}
                placeholder={t.zoteroSelectRole}
              />
              <button className='zotero-panel-remove-btn' onClick={() => removePageLink(project.id, docId, pageId)} title='Remove'>×</button>
            </div>
          ))}
        </div>
      )}
      <div className='zotero-panel-divider' />
      <div className='zotero-panel-section-label'>{t.zoteroAddToProject}</div>
      <select className='zotero-panel-select' value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
        <option value=''>{t.zoteroSelectProject}</option>
        {projects.filter(p => !linkedProjects.find(l => l.project.id === p.id)).map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input
        className='zotero-panel-input'
        value={roleInput}
        onChange={e => setRoleInput(e.target.value)}
        placeholder={t.zoteroSelectRole}
        list={roleListId}
      />
      <datalist id={roleListId}>
        {customRoles.map(r => <option key={r} value={r} />)}
      </datalist>
      {zoteroEnabled && academicRoles.length > 0 && (
        <div className='zotero-panel-role-shortcuts'>
          {academicRoles.map(r => (
            <button
              key={r}
              className='zotero-panel-role-chip'
              onClick={() => setRoleInput(r)}
              type='button'
            >
              {r}
            </button>
          ))}
        </div>
      )}
      <input
        className='zotero-panel-input'
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={t.zoteroNoteOptional}
      />
      <div className='zotero-panel-actions'>
        <button className='zotero-panel-btn-cancel' onClick={onClose}>{t.cancel}</button>
        <button className='zotero-panel-btn-confirm' onClick={handleAdd} disabled={!selectedProject}>{t.confirm}</button>
      </div>
    </div>,
    document.body
  )
}
