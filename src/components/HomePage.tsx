
import { useEffect, useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { useLangStore } from '../store/langStore'
import { readWorkspace, createWorkspaceFolder, WorkspaceStructure, WorkspaceFile, moveFile, renameFile, renameFolder, deleteFile, deleteFolder } from '../utils/workspace'
import { convertToPresentation } from '../utils/presentationConverter'
import { saveHandout, loadHandoutFromPath } from '../utils/handoutPackage'
import { open, confirm } from '@tauri-apps/plugin-dialog'
import { join } from '@tauri-apps/api/path'
import { FileText, Folder, FolderOpen } from 'lucide-react'
import { readZoteroIndex, ZoteroIndex } from '../plugins/zotero/zoteroIndex'
import { usePluginStore } from '../store/pluginStore'
import AddToProjectFromFilePanel from './AddToProjectFromFilePanel'

interface HomePageProps {
  workspacePath: string | null
  onOpenEditor: () => void
  onOpenSettings: () => void
  onOpenProjects: () => void
}

export default function HomePage({ workspacePath, onOpenEditor, onOpenSettings, onOpenProjects }: HomePageProps) {
  const { loadFromDocument } = useDocumentStore()
  const { t } = useLangStore()
  const [workspace, setWorkspace] = useState<WorkspaceStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [targetFolderPath, setTargetFolderPath] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'file' | 'folder'
    path: string
    name: string
  } | null>(null)
  const [projectPanel, setProjectPanel] = useState<{ x: number; y: number; docId: string } | null>(null)
  const [showRename, setShowRename] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renamePath, setRenamePath] = useState('')
  const [renameType, setRenameType] = useState<'file' | 'folder'>('file')
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [zoteroIndex, setZoteroIndex] = useState<ZoteroIndex>({})
  const { enabledPlugins } = usePluginStore()

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderPath)) {
        next.delete(folderPath)
      } else {
        next.add(folderPath)
      }
      return next
    })
  }

  useEffect(() => {
    if (workspacePath) {
      refreshWorkspace()
    }
  }, [workspacePath])

  const refreshWorkspace = async () => {
    if (!workspacePath) return
    setLoading(true)
    try {
      const structure = await readWorkspace(workspacePath)
      setWorkspace(structure)
    } catch (e) {
    } finally {
      setLoading(false)
      if (usePluginStore.getState().enabledPlugins.includes('zotero')) {
        const index = await readZoteroIndex(workspacePath)
        setZoteroIndex(index)
      }
    }
  }

  const handleNewDocument = async () => {
    if (!newDocTitle.trim() || !workspacePath) return
    const { document: currentDoc } = useDocumentStore.getState()
    const newDoc = {
      id: crypto.randomUUID(),
      title: newDocTitle.trim(),
      theme: currentDoc.theme,
      pages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const saveTo = targetFolderPath ?? workspacePath
    const filePath = await join(saveTo, newDocTitle.trim() + '.handout')
    loadFromDocument(newDoc, filePath)
    setShowNewDoc(false)
    setNewDocTitle('')
    setTargetFolderPath(null)
    onOpenEditor()
  }

  const handleOpenFile = async (filePath: string) => {
    try {
      const result = await loadHandoutFromPath(filePath)
      if (result) {
        loadFromDocument(result.doc, filePath)
        onOpenEditor()
      }
    } catch {
    }
  }

  const handleOpenDialog = async () => {
    try {
      const selected = await open({
        filters: [{ name: 'Handout', extensions: ['handout'] }],
        multiple: false,
      })
      if (typeof selected === 'string') {
        await handleOpenFile(selected)
      }
    } catch {
    }
  }

  const handleNewFolder = async () => {
    if (!newFolderName.trim() || !workspacePath) return
    await createWorkspaceFolder(workspacePath, newFolderName.trim())
    setShowNewFolder(false)
    setNewFolderName('')
    await refreshWorkspace()
  }

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder', path: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, path, name })
  }

  const closeContextMenu = () => setContextMenu(null)

  const handleRename = (path: string, name: string, type: 'file' | 'folder') => {
    setRenamePath(path)
    setRenameValue(name)
    setRenameType(type)
    setShowRename(true)
    closeContextMenu()
  }

  const handleRenameConfirm = async () => {
    if (!renameValue.trim()) return
    try {
      if (renameType === 'file') {
        await renameFile(renamePath, renameValue.trim())
      } else {
        await renameFolder(renamePath, renameValue.trim())
      }
      setShowRename(false)
      await refreshWorkspace()
    } catch (e) {
    }
  }

  const handleConvertToPresentation = async (filePath: string) => {
    try {
      // 讀取來源文件
      const sourceDoc = await loadHandoutFromPath(filePath)
      if (!sourceDoc) return
      // 轉換
      const presentationDoc = convertToPresentation(sourceDoc.doc)
      // 決定儲存路徑：同資料夾，檔名加 _presentation
      const dir = filePath.substring(0, filePath.lastIndexOf('\\'))
      const baseName = filePath
        .substring(filePath.lastIndexOf('\\') + 1)
        .replace('.handout', '')
      const savePath = await join(dir, baseName + '_presentation.handout')
      // 寫入磁碟
      await saveHandout(presentationDoc, savePath)
      // 載入並開啟
      loadFromDocument(presentationDoc, savePath)
      onOpenEditor()
    } catch (e) {
      console.error('轉為簡報失敗：', e)
    }
  }

  const handleDeleteFile = async (path: string) => {
    closeContextMenu()
    const ok = await confirm(t.confirmDelete + '?', { title: t.deleteFile, kind: 'warning' })
    if (ok) {
      await deleteFile(path)
      await refreshWorkspace()
    }
  }

  const handleDeleteFolder = async (path: string, hasFiles: boolean) => {
    closeContextMenu()
    const message = hasFiles ? t.deleteFolderConfirm : t.confirmDelete + '?'
    const ok = await confirm(message, { title: t.deleteFolder, kind: 'warning' })
    if (ok) {
      await deleteFolder(path)
      await refreshWorkspace()
    }
  }

  const handleDragStart = (e: React.DragEvent, filePath: string) => {
    e.dataTransfer.setData('filePath', filePath)
  }

  const handleDrop = async (e: React.DragEvent, targetFolderPath: string) => {
    e.preventDefault()
    setDragOverFolder(null)
    const filePath = e.dataTransfer.getData('filePath')
    if (!filePath || filePath === targetFolderPath) return
    try {
      await moveFile(filePath, targetFolderPath)
      await refreshWorkspace()
    } catch (err) {
    }
  }

  const handleDropToRoot = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolder(null)
    if (!workspacePath) return
    const filePath = e.dataTransfer.getData('filePath')
    if (!filePath) return
    try {
      await moveFile(filePath, workspacePath)
      await refreshWorkspace()
    } catch (err) {
    }
  }

  const renderFileItem = (file: WorkspaceFile) => {
    const entry = zoteroIndex[file.path]
    return (
      <div
        key={file.path}
        className='home-file-item'
        onClick={() => handleOpenFile(file.path)}
        onContextMenu={(e) => handleContextMenu(e, 'file', file.path, file.name)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          handleDragStart(e, file.path)
        }}
      >
        <FileText size={14} className='home-file-icon' />
        <span className='home-file-name'>{file.name}</span>
        {enabledPlugins.includes('zotero') && entry?.citekey && (
          <span className='home-file-citekey' title={entry.citekey}>
            {entry.paperTitle || entry.citekey}
          </span>
        )}
      </div>
    )
  }

  const renderEmpty = () => (
    <div className='home-empty'>
      <p className='home-empty-title'>{t.emptyWorkspace}</p>
      <p className='home-empty-hint'>{t.emptyWorkspaceHint}</p>
    </div>
  )

  const hasContent = workspace && (workspace.rootFiles.length > 0 || workspace.folders.length > 0)

  return (
    <div className='home-shell' onContextMenu={closeContextMenu}>
      <div className='home-header'>
        <span className='home-logo'>Chiatom</span>
        <div className='home-header-actions'>
          <button className='toolbar-btn' onClick={onOpenProjects}>{t.zoteroProjects}</button>
          <button className='toolbar-btn' onClick={handleOpenDialog}>{t.openFile}</button>
          <button className='toolbar-btn' onClick={() => setShowNewFolder(true)}>{t.newFolder}</button>
          <button className='toolbar-btn primary' onClick={() => setShowNewDoc(true)}>{t.newDocument}</button>
          <button className='toolbar-btn icon-btn' onClick={onOpenSettings}>⚙</button>
        </div>
      </div>

      <div className='home-body'>
                {!hasContent && !loading && (
          <div className='home-guide'>
            <div className='home-guide-step'>
              <span className='home-guide-num'>01</span>
              <span className='home-guide-text'>{t.homeGuide1}</span>
            </div>
            <div className='home-guide-step'>
              <span className='home-guide-num'>02</span>
              <span className='home-guide-text'>{t.homeGuide2}</span>
            </div>
            <div className='home-guide-step'>
              <span className='home-guide-num'>03</span>
              <span className='home-guide-text'>{t.homeGuide3}</span>
            </div>
          </div>
        )}

        {loading && <div className='home-loading'>...</div>}

        {!loading && !hasContent && renderEmpty()}

        {!loading && hasContent && (
          <div
            className='home-file-list'
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={handleDropToRoot}
          >
            {workspace!.folders.map(folder => (
              <div
                key={folder.path}
                className={dragOverFolder === folder.path ? 'home-folder drag-over' : 'home-folder'}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverFolder(folder.path)
                }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverFolder(null) }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(e, folder.path) }}
              >
                <div
                  className='home-folder-header'
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder.path, folder.name)}
                  onClick={() => toggleFolder(folder.path)}
                >
                  {expandedFolders.has(folder.path)
                    ? <FolderOpen size={14} className='home-folder-icon' />
                    : <Folder size={14} className='home-folder-icon' />
                  }
                  <span className='home-folder-name'>{folder.name}</span>
                </div>
                {expandedFolders.has(folder.path) && (
                  <div className='home-folder-files'>
                    {folder.files.map(renderFileItem)}
                  </div>
                )}
              </div>
            ))}
            {workspace!.rootFiles.map(renderFileItem)}
          </div>
        )}
      </div>

      {showNewDoc && (
        <div className='modal-overlay'>
          <div className='modal'>
            <p className='modal-title'>{t.newDocument}</p>
            <input
              className='modal-input'
              placeholder={t.newDocumentTitle}
              value={newDocTitle}
              onChange={e => setNewDocTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewDocument()}
              autoFocus
            />
            <div className='modal-actions'>
              <button className='toolbar-btn' onClick={() => { setShowNewDoc(false); setNewDocTitle(''); setTargetFolderPath(null) }}>{t.cancel}</button>
              <button className='toolbar-btn primary' onClick={handleNewDocument}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {showNewFolder && (
        <div className='modal-overlay'>
          <div className='modal'>
            <p className='modal-title'>{t.newFolder}</p>
            <input
              className='modal-input'
              placeholder={t.newFolderName}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewFolder()}
              autoFocus
            />
            <div className='modal-actions'>
              <button className='toolbar-btn' onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>{t.cancel}</button>
              <button className='toolbar-btn primary' onClick={handleNewFolder}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className='home-context-menu'
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={closeContextMenu}
        >
          {contextMenu.type === 'folder' && (
            <div className='home-context-item' onClick={() => {
              setTargetFolderPath(contextMenu.path)
              setShowNewDoc(true)
              closeContextMenu()
            }}>
              {t.newDocument}
            </div>
          )}
          <div className='home-context-item' onClick={() => handleRename(contextMenu.path, contextMenu.name, contextMenu.type)}>
            {t.rename}
          </div>
          {contextMenu.type === 'file' && (
            <>
              <div className='home-context-item' onClick={() => {
                setProjectPanel({ x: contextMenu.x, y: contextMenu.y, docId: contextMenu.path })
                closeContextMenu()
              }}>
                {t.zoteroAddToProject}
              </div>
              <div className='home-context-item' onClick={() => { handleConvertToPresentation(contextMenu.path); setContextMenu(null) }}>
                {t.convertToPresentation}
              </div>
              <div className='home-context-item danger' onClick={() => handleDeleteFile(contextMenu.path)}>
                {t.deleteFile}
              </div>
            </>
          )}
          {contextMenu.type === 'folder' && (
            <div className='home-context-item danger' onClick={() => handleDeleteFolder(contextMenu.path, workspace?.folders.find(f => f.path === contextMenu.path)?.files.length ? true : false)}>
              {t.deleteFolder}
            </div>
          )}
        </div>
      )}

      {showRename && (
        <div className='modal-overlay'>
          <div className='modal'>
            <p className='modal-title'>{t.rename}</p>
            <input
              className='modal-input'
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRenameConfirm()}
              autoFocus
            />
            <div className='modal-actions'>
              <button className='toolbar-btn' onClick={() => setShowRename(false)}>{t.cancel}</button>
              <button className='toolbar-btn primary' onClick={handleRenameConfirm}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {projectPanel && (
        <AddToProjectFromFilePanel
          docId={projectPanel.docId}
          anchorX={projectPanel.x}
          anchorY={projectPanel.y}
          onClose={() => setProjectPanel(null)}
        />
      )}
    </div>
  )
}
