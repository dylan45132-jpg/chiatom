import { useEffect, useState } from 'react'
import { basename } from '@tauri-apps/api/path'
import { useLangStore } from '../../store/langStore'
import { useZoteroProjectStore } from './zoteroProjectStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useDocumentStore } from '../../store/documentStore'
import { loadHandoutFromPath, readHandoutMeta } from '../../utils/handoutPackage'

interface Props {
  workspacePath: string | null
}

export default function ZoteroProjectsPage({ workspacePath }: Props) {
  const { t } = useLangStore()
  const {
    projects,
    loadProjects,
    addProject,
    removeProject,
    renameProject,
    isLoaded,
  } = useZoteroProjectStore()
  const { goBack, navigate } = useNavigationStore()

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [docLabels, setDocLabels] = useState<Record<string, string>>({})
  const [pageLabels, setPageLabels] = useState<Record<string, string>>({})
  const [workspaceFiles, setWorkspaceFiles] = useState<{ name: string; path: string }[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState('')

  useEffect(() => {
    if (!isLoaded) loadProjects()
  }, [isLoaded, loadProjects])

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (!workspacePath) return
    import('../../utils/workspace').then(({ readWorkspace }) => {
      readWorkspace(workspacePath).then(structure => {
        const allFiles = [
          ...structure.rootFiles,
          ...structure.folders.flatMap(f => f.files),
        ]
        setWorkspaceFiles(allFiles)
      })
    })
  }, [workspacePath])

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null

  useEffect(() => {
    if (!selectedProject) return
    const docIds = [...new Set(selectedProject.pageLinks.map(l => l.docId))]
    Promise.all(
      docIds.map(async id => {
        const label = await getDocLabel(id)
        loadDocMeta(id)
        return [id, label] as const
      })
    ).then(entries => {
      setDocLabels(Object.fromEntries(entries))
    })
  }, [selectedProject])

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return
    await addProject(newProjectName.trim(), selectedNoteId)
    setNewProjectName('')
    setSelectedNoteId('')
    setShowNewProject(false)
  }

  const handleRenameConfirm = async () => {
    if (!renamingId || !renameValue.trim()) return
    await renameProject(renamingId, renameValue.trim())
    setRenamingId(null)
    setRenameValue('')
  }

  const handleOpenDoc = async (docPath: string) => {
    try {
      const result = await loadHandoutFromPath(docPath)
      if (result) {
        useDocumentStore.getState().loadFromDocument(result.doc, docPath)
        navigate('editor')
      }
    } catch (e) {
      console.error('Failed to open doc:', e)
    }
  }

  const getDocLabel = async (docPath: string): Promise<string> => {
    try {
      const name = await basename(docPath)
      return name.replace('.handout', '')
    } catch {
      return docPath
    }
  }

  const loadDocMeta = async (docPath: string) => {
    const meta = await readHandoutMeta(docPath)
    if (!meta) return
    const labels: Record<string, string> = {}
    meta.pages.forEach(p => {
      labels[p.id] = p.title
    })
    setPageLabels(prev => ({ ...prev, ...labels }))
  }

  // ── 連結列表：以文獻筆記為分組 ──────────────────────

  const renderLinkedNotes = () => {
    if (!selectedProject) return null
    if (selectedProject.pageLinks.length === 0) {
      return <div className='zp-empty'>{t.zoteroNoLinks}</div>
    }

    const byDoc = selectedProject.pageLinks.reduce<Record<string, typeof selectedProject.pageLinks>>((acc, link) => {
      if (!acc[link.docId]) acc[link.docId] = []
      acc[link.docId].push(link)
      return acc
    }, {})

    return (
      <div className='zp-structure'>
        {Object.entries(byDoc).map(([docId, links]) => (
          <div key={docId} className='zp-doc-group'>
            <div className='zp-doc-label' onClick={() => handleOpenDoc(docId)}>
              {docLabels[docId] ?? docId.slice(0, 8) + '…'}
            </div>
            <div className='zp-page-links'>
              {links.map((link, i) => (
                <div key={i} className='zp-page-link'>
                  <span className='zp-page-id'>
                    {pageLabels[link.pageId] ?? `${t.pageTitle} ${link.pageId.slice(0, 6)}…`}
                  </span>
                  <span className='zp-role-badge'>{link.role}</span>
                  {link.note && <span className='zp-note'>{link.note}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className='zp-shell'>
      <div className='zp-header'>
        <button className='toolbar-btn' onClick={goBack}>← {t.back}</button>
        <span className='zp-title'>{t.zoteroProjects}</span>
      </div>

      <div className='zp-body'>
        {/* 左側專案列表 */}
        <div className='zp-sidebar'>
          <div className='zp-sidebar-header'>
            <span className='zp-sidebar-label'>{t.zoteroProjects}</span>
            <button className='zp-add-btn' onClick={() => setShowNewProject(true)}>+</button>
          </div>

          <div className='zp-project-list'>
            {projects.map(project => (
              <div
                key={project.id}
                className={`zp-project-item ${project.id === selectedProjectId ? 'is-active' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
                onDoubleClick={() => {
                  setRenamingId(project.id)
                  setRenameValue(project.name)
                }}
              >
                {renamingId === project.id ? (
                  <input
                    className='zp-rename-input'
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameConfirm()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={handleRenameConfirm}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className='zp-project-name'>{project.name}</span>
                    <span className='zp-project-count'>{project.pageLinks.length}</span>
                    <button
                      className='zp-project-delete-btn'
                      onClick={e => {
                        e.stopPropagation()
                        removeProject(project.id)
                        if (selectedProjectId === project.id) setSelectedProjectId(null)
                      }}
                      title={t.zoteroDeleteProject}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}

            {projects.length === 0 && (
              <div className='zp-empty'>{t.zoteroNoLinks}</div>
            )}
          </div>

          {showNewProject && (
            <div className='zp-new-project'>
              <input
                className='zp-new-project-input'
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder={t.zoteroProjectName}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddProject()
                  if (e.key === 'Escape') { setShowNewProject(false); setNewProjectName(''); setSelectedNoteId('') }
                }}
                autoFocus
              />
              <select
                className='zp-new-project-input'
                value={selectedNoteId}
                onChange={e => setSelectedNoteId(e.target.value)}
              >
                <option value=''>{t.zoteroSelectNote}</option>
                {workspaceFiles.map(f => (
                  <option key={f.path} value={f.path}>{f.name}</option>
                ))}
              </select>
              <p className='zp-hint'>{t.zoteroSelectNoteHint}</p>
              <div className='zp-new-project-actions'>
                <button className='toolbar-btn' onClick={() => { setShowNewProject(false); setNewProjectName(''); setSelectedNoteId('') }}>
                  {t.cancel}
                </button>
                <button className='toolbar-btn primary' onClick={handleAddProject}>
                  {t.confirm}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 主區域 */}
        <div className='zp-main'>
          {selectedProject ? (
            <>
              <div className='zp-main-header'>
                <span className='zp-main-title'>{selectedProject.name}</span>
                {selectedProject.noteId && (
                  <button
                    className='toolbar-btn'
                    onClick={() => handleOpenDoc(selectedProject.noteId)}
                  >
                    {t.zoteroProjects} →
                  </button>
                )}
              </div>
              {renderLinkedNotes()}
            </>
          ) : (
            <div className='zp-empty'>{t.zoteroNoLinks}</div>
          )}
        </div>
      </div>
    </div>
  )
}