import { useEffect, useState } from 'react'
import { basename } from '@tauri-apps/api/path'
import { useLangStore } from '../store/langStore'
import { useProjectStore } from '../store/projectStore'
import { useNavigationStore } from '../store/navigationStore'
import { useDocumentStore } from '../store/documentStore'
import { loadHandoutFromPath, readHandoutMeta } from '../utils/handoutPackage'
import { usePluginStore } from '../store/pluginStore'
import { readZoteroIndex, ZoteroIndexEntry } from '../plugins/zotero/zoteroIndex'
import { getSettings } from '../store/settingsStore'
import { exportToHtml } from '../editor/renderer'
import { resolveImageSrcs } from '../utils/handoutPackage'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { toast } from '../store/toastStore'
import { getBuiltinThemes } from '../theme/builtinThemes'

export default function ProjectsPage() {
  const { t } = useLangStore()
  const {
    projects,
    loadProjects,
    addProject,
    removeProject,
    renameProject,
    isLoaded,
  } = useProjectStore()
  const { goBack, navigate } = useNavigationStore()

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [docLabels, setDocLabels] = useState<Record<string, string>>({})
  const [pageLabels, setPageLabels] = useState<Record<string, string>>({})
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null)

  const { isEnabled } = usePluginStore()
  const zoteroEnabled = isEnabled('zotero')
  const [view, setView] = useState<'pages' | 'literature'>('pages')
  const [zoteroIndex, setZoteroIndex] = useState<Record<string, ZoteroIndexEntry>>({})
  const builtinThemes = getBuiltinThemes()
    const [selectedThemeId, setSelectedThemeId] = useState('slate')
  const [exportMode, setExportMode] = useState<'handout' | 'presentation'>('handout')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!isLoaded) loadProjects()
  }, [isLoaded, loadProjects])

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

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

  useEffect(() => {
    if (!zoteroEnabled) return
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    readZoteroIndex(workspacePath).then(index => setZoteroIndex(index))
  }, [zoteroEnabled, selectedProjectId])

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return
    await addProject(newProjectName.trim())
    setNewProjectName('')
    setShowNewProject(false)
  }

  const handleRenameConfirm = async () => {
    if (!renamingId || !renameValue.trim()) return
    await renameProject(renamingId, renameValue.trim())
    setRenamingId(null)
    setRenameValue('')
  }

  const handleDuplicateProject = async (projectId: string) => {
    const source = projects.find(p => p.id === projectId)
    if (!source) return
    await addProject(source.name + ' 副本')
    const newProject = useProjectStore.getState().projects[useProjectStore.getState().projects.length - 1]
    if (!newProject) return
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const updated = useProjectStore.getState().projects.map(p =>
      p.id === newProject.id
        ? { ...p, pageLinks: source.pageLinks.map(l => ({ ...l })) }
        : p
    )
    useProjectStore.setState({ projects: updated })
    const { writeProjects: wp } = await import('../store/projects')
    await wp(workspacePath, updated)
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

  const handleOpenPage = async (docPath: string, pageId: string) => {
    try {
      const result = await loadHandoutFromPath(docPath)
      if (result) {
        useDocumentStore.getState().loadFromDocument(result.doc, docPath)
        navigate({ view: 'editor', savePath: docPath, pageId })
      }
    } catch (e) {
      console.error('Failed to open page:', e)
    }
  }

  const handleExport = async () => {
    if (!selectedProject || selectedProject.pageLinks.length === 0) return
    setExporting(true)
    try {
      const docIds = [...new Set(selectedProject.pageLinks.map(l => l.docId))]
      const docMap: Record<string, import('../store/documentStore').Document> = {}
      await Promise.all(docIds.map(async id => {
        const handout = await loadHandoutFromPath(id)
        if (handout) {
          docMap[id] = handout.doc
        }
      }))

      const pages: { title: string; content: import('@tiptap/react').JSONContent }[] = []
      for (const link of selectedProject.pageLinks) {
        const doc = docMap[link.docId]
        if (!doc) continue
        const page = doc.pages.find(p => p.id === link.pageId)
        if (!page) continue
        pages.push({ title: page.title, content: page.content })
      }

      if (pages.length === 0) {
        setExporting(false)
        return
      }

      const theme = builtinThemes.find(th => th.id === selectedThemeId) ?? builtinThemes[0]
      const themeConfig = { name: theme.name, css: theme.css, json: theme.json }

      const resolvedPages = await resolveImageSrcs(pages as any)
            const html = exportToHtml(resolvedPages, selectedProject.name, themeConfig, exportMode)

      const targetPath = await save({
        filters: [{ name: t.filterHtml, extensions: ['html'] }],
        defaultPath: `${selectedProject.name}.html`,
      })
      if (!targetPath) return
      await writeTextFile(targetPath, html)
      toast.success(t.toastExported)
    } catch (e) {
      console.error('Export failed:', e)
      toast.error(t.toastExportFailed)
    } finally {
      setExporting(false)
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
                  <span
                    className='zp-page-id zp-clickable'
                    onClick={() => handleOpenPage(link.docId, link.pageId)}
                  >
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

  const renderLiteratureView = () => {
    if (!selectedProject) return null
    if (selectedProject.pageLinks.length === 0) {
      return <div className='zp-empty'>{t.zoteroNoLinks}</div>
    }

    const byPaper: Record<string, { entry: ZoteroIndexEntry | null; links: typeof selectedProject.pageLinks }> = {}

    for (const link of selectedProject.pageLinks) {
      const entry = zoteroIndex[link.docId] ?? null
      const key = entry?.citekey ?? '__unlinked__'
      if (!byPaper[key]) byPaper[key] = { entry, links: [] }
      byPaper[key].links.push(link)
    }

    return (
      <div className='zp-structure'>
        {Object.entries(byPaper).map(([key, { entry, links }]) => (
          <div key={key} className='zp-doc-group'>
            <div className='zp-doc-label'>
              {entry ? (
                <span title={entry.paperTitle}>📎 {entry.citekey}</span>
              ) : (
                <span className='zp-unlinked'>未連結文獻</span>
              )}
            </div>
            <div className='zp-page-links'>
              {links.map((link, i) => (
                <div key={i} className='zp-page-link'>
                  <span
                    className='zp-page-id zp-clickable'
                    onClick={() => handleOpenDoc(link.docId)}
                  >
                    {docLabels[link.docId] ?? link.docId.slice(0, 8) + '…'}
                    {' · '}
                    {pageLabels[link.pageId] ?? `${t.pageTitle} ${link.pageId.slice(0, 6)}…`}
                  </span>
                  {link.role && <span className='zp-role-badge'>{link.role}</span>}
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
    <div className='zp-shell' onClick={() => setContextMenu(null)}>
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
                onContextMenu={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id })
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
                  if (e.key === 'Escape') { setShowNewProject(false); setNewProjectName('') }
                }}
                autoFocus
              />
              <div className='zp-new-project-actions'>
                <button className='toolbar-btn' onClick={() => { setShowNewProject(false); setNewProjectName('') }}>
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
                {zoteroEnabled && (
                  <div className='zp-view-toggle'>
                    <button
                      className={`zp-view-btn ${view === 'pages' ? 'is-active' : ''}`}
                      onClick={() => setView('pages')}
                    >
                      {t.pages}
                    </button>
                    <button
                      className={`zp-view-btn ${view === 'literature' ? 'is-active' : ''}`}
                      onClick={() => setView('literature')}
                    >
                      {t.zoteroLiteratureView}
                    </button>
                  </div>
                )}
                <div className='zp-export-row'>
                  <select
                    className='zp-theme-select'
                    value={selectedThemeId}
                    onChange={e => setSelectedThemeId(e.target.value)}
                  >
                                        {builtinThemes.map(th => (
                      <option key={th.id} value={th.id}>{th.name}</option>
                    ))}
                  </select>
                  <select
                    value={exportMode}
                    onChange={e => setExportMode(e.target.value as 'handout' | 'presentation')}
                  >
                    <option value="handout">{t.handoutMode ?? '講義'}</option>
                    <option value="presentation">{t.presentationMode ?? '簡報'}</option>
                  </select>
                  <button
                    className='toolbar-btn'
                    onClick={handleExport}
                    disabled={exporting || !selectedProject || selectedProject.pageLinks.length === 0}
                  >
                    {exporting ? '...' : t.exportHtml}
                  </button>
                </div>
              </div>
              {view === 'pages' ? renderLinkedNotes() : renderLiteratureView()}
            </>
          ) : (
            <div className='zp-empty'>{t.zoteroNoLinks}</div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className='home-context-menu'
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
          onClick={e => e.stopPropagation()}
        >
          <div className='home-context-item' onClick={() => {
            const p = projects.find(p => p.id === contextMenu.projectId)
            if (p) { setRenamingId(p.id); setRenameValue(p.name) }
            setContextMenu(null)
          }}>
            {t.rename}
          </div>
          <div className='home-context-item' onClick={() => {
            handleDuplicateProject(contextMenu.projectId)
            setContextMenu(null)
          }}>
            複製
          </div>
          <div className='home-context-item danger' onClick={() => {
            removeProject(contextMenu.projectId)
            if (selectedProjectId === contextMenu.projectId) setSelectedProjectId(null)
            setContextMenu(null)
          }}>
            {t.zoteroDeleteProject}
          </div>
        </div>
      )}
    </div>
  )
}
