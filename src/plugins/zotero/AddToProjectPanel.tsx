import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLangStore } from '../../store/langStore'
import { useZoteroProjectStore, getDefaultRoles } from './zoteroProjectStore'

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

  const {
    projects,
    customRoles,
    addPageLink,
    removePageLink,
    updatePageLink,
    getLinksForPage,
    addCustomRole,
  } = useZoteroProjectStore()

  const linkedProjects = getLinksForPage(docId, pageId)
  const allRoles = [...getDefaultRoles(), ...customRoles]

  const [selectedProject, setSelectedProject] = useState('')
  const [selectedRole, setSelectedRole] = useState(allRoles[0] ?? '')
  const [note, setNote] = useState('')
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false)

  // 位置修正：避免超出視窗
  useLayoutEffect(() => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    let x = anchorX
    let y = anchorY
    if (rect.right > window.innerWidth - 8)
      x = Math.max(8, window.innerWidth - rect.width - 8)
    if (rect.bottom > window.innerHeight - 8)
      y = Math.max(8, window.innerHeight - rect.height - 8)
    setPos({ x, y })
  }, [anchorX, anchorY])

  // 外部點擊 / Escape 關閉
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
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
  }, [onClose])

  const handleAdd = async () => {
    if (!selectedProject || !selectedRole) return
    await addPageLink(selectedProject, { docId, pageId, role: selectedRole, note: note || undefined })
    setSelectedProject('')
    setNote('')
  }

  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim()
    if (!trimmed) return
    addCustomRole(trimmed)
    setSelectedRole(trimmed)
    setCustomRoleInput('')
    setShowCustomRoleInput(false)
  }

  return createPortal(
    <div
      ref={panelRef}
      className="zotero-project-panel"
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
    >
      {/* 已連結的專案 */}
      <div className="zotero-panel-section-label">{t.zoteroLinkedProjects}</div>
      {linkedProjects.length === 0 ? (
        <div className="zotero-panel-empty">{t.zoteroNoLinkedProjects}</div>
      ) : (
        <div className="zotero-panel-linked-list">
          {linkedProjects.map(({ project, link }) => (
            <div key={project.id} className="zotero-panel-linked-item">
              <span className="zotero-panel-linked-name">{project.name}</span>
              <select
                className="zotero-panel-role-select"
                value={link.role}
                onChange={e => updatePageLink(project.id, docId, pageId, { role: e.target.value })}
              >
                {allRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                className="zotero-panel-remove-btn"
                onClick={() => removePageLink(project.id, docId, pageId)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="zotero-panel-divider" />

      {/* 新增連結 */}
      <div className="zotero-panel-section-label">{t.zoteroAddToProject}</div>

      <select
        className="zotero-panel-select"
        value={selectedProject}
        onChange={e => setSelectedProject(e.target.value)}
      >
        <option value="">{t.zoteroSelectProject}</option>
        {projects
          .filter(p => !linkedProjects.find(l => l.project.id === p.id))
          .map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </select>

      <select
        className="zotero-panel-select"
        value={selectedRole}
        onChange={e => setSelectedRole(e.target.value)}
      >
        {allRoles.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {showCustomRoleInput ? (
        <div className="zotero-panel-custom-role-row">
          <input
            className="zotero-panel-input"
            value={customRoleInput}
            onChange={e => setCustomRoleInput(e.target.value)}
            placeholder={t.zoteroCustomRole}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCustomRole() }}
            autoFocus
          />
          <button className="zotero-panel-btn-small" onClick={handleAddCustomRole}>+</button>
          <button className="zotero-panel-btn-small" onClick={() => setShowCustomRoleInput(false)}>×</button>
        </div>
      ) : (
        <button
          className="zotero-panel-add-role-btn"
          onClick={() => setShowCustomRoleInput(true)}
        >
          + {t.zoteroAddCustomRole}
        </button>
      )}

      <input
        className="zotero-panel-input"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={t.zoteroNoteOptional}
      />

      <div className="zotero-panel-actions">
        <button className="zotero-panel-btn-cancel" onClick={onClose}>
          {t.cancel}
        </button>
        <button
          className="zotero-panel-btn-confirm"
          onClick={handleAdd}
          disabled={!selectedProject || !selectedRole}
        >
          {t.confirm}
        </button>
      </div>
    </div>,
    document.body
  )
}