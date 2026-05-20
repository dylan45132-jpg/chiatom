import { useEffect, useRef, useState } from 'react'
import './styles/tokens.css'
import './styles/base.css'
import './styles/editor.css'
import './styles/components/theme-store.css'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import Toast from './components/Toast'
import { useDocumentStore } from './store/documentStore'
import { getSettings, loadSettings, saveSettings, Settings } from './store/settingsStore'
import { ensureWorkspaceExists, getDefaultWorkspacePath } from './utils/workspace'
import HomePage from './components/HomePage'
import SettingsPage from './components/SettingsPage'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useLangStore } from './store/langStore'
import { confirm } from '@tauri-apps/plugin-dialog'
import { usePluginStore } from './store/pluginStore'
import { checkForUpdates, UpdateInfo } from './utils/updater'
import UpdateNotice from './components/UpdateNotice'
import ProjectsPage from './components/ProjectsPage'
import { useProjectStore } from './store/projectStore'
import { useNavigationStore } from './store/navigationStore'
import { clearPageReferenceCache } from './editor/extensions/PageReferenceSuggestion'
import AboutPage from './components/AboutPage'
import PresentationNotes from './components/PresentationNotes'
import ThemeStore from './components/ThemeStore'
import ThemeCustomize from './components/ThemeCustomize'
import LibraryPage from './components/LibraryPage'
import PresentationView from './components/PresentationView'

export default function App() {
  const { document, activePageId, setActivePage, isDirty, savePath } = useDocumentStore()
  const { currentView, navigate } = useNavigationStore()
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(getSettings())
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const isAskingRef = useRef(false)
  const t = useLangStore((state) => state.t)

  const setThemeMode = (mode: 'light' | 'dark') => {
    window.document.documentElement.setAttribute('data-theme', mode)
    const newSettings = { ...settings, theme: mode }
    saveSettings(newSettings)
    setSettings(newSettings)
  }

  useEffect(() => {
    const initialize = async () => {
      const loadedSettings = await loadSettings()
      setSettings(loadedSettings)
      usePluginStore.getState().syncFromSettings()

      if (loadedSettings.theme) {
        window.document.documentElement.setAttribute('data-theme', loadedSettings.theme)
      }
      const { setLang } = useLangStore.getState()
      if (loadedSettings.language) {
        setLang(loadedSettings.language)
      }
      let path = loadedSettings.workspacePath
      let mustSave = false
      if (!path) {
        path = await getDefaultWorkspacePath()
        mustSave = true
      }
      await ensureWorkspaceExists(path)
      setWorkspacePath(path)
      if (mustSave && path) {
        const newSettings = { ...loadedSettings, workspacePath: path }
        await saveSettings(newSettings)
        setSettings(newSettings)
      }

      // 載入專案資料（主程式核心功能，永遠載入）
      await useProjectStore.getState().loadProjects()
      
      checkForUpdates().then(info => {
        if (info) setUpdateInfo(info)
      })
    }
    initialize()
  }, [])

  useEffect(() => {
    if (currentView === 'editor' && !activePageId && document.pages.length > 0) {
      setActivePage(document.pages[0].id)
    }
  }, [currentView, activePageId, document.pages, setActivePage])

  useEffect(() => {
    if (currentView !== 'editor') return
    if (!isDirty || !savePath) return
    const timer = setTimeout(async () => {
      try {
        const { document, savePath, setSavePath, setDirty } = useDocumentStore.getState()
        const { saveHandout } = await import('./utils/handoutPackage')
        const returnedPath = await saveHandout(document, savePath ?? undefined)
        if (returnedPath) {
          setSavePath(returnedPath)
          setDirty(false)
          clearPageReferenceCache()
        }
      } catch (e) {
        console.error('Autosave failed:', e)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [isDirty, savePath, currentView])

  useEffect(() => {
    let unlisten: (() => void) | undefined
    const setup = async () => {
      const appWindow = getCurrentWindow()
      unlisten = await appWindow.onCloseRequested(async (event) => {
        event.preventDefault()
        if (isAskingRef.current) return
        const { isDirty } = useDocumentStore.getState()
        if (!isDirty) {
          await appWindow.destroy()
          return
        }
        isAskingRef.current = true
        try {
          const { t } = useLangStore.getState()
          const ok = await confirm(t.unsavedChanges, {
            title: 'Chiatom',
            kind: 'warning',
          })
          if (ok) {
            await appWindow.destroy()
          }
        } finally {
          isAskingRef.current = false
        }
      })
    }
    setup()
    return () => { unlisten?.() }
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            workspacePath={workspacePath}
            onOpenEditor={() => navigate('editor')}
            onOpenSettings={() => navigate('settings')}
            onOpenProjects={() => navigate('zotero-projects')}
          />
        )
      case 'editor':
        return (
          <div className='app-shell'>
            <Toolbar onGoHome={() => navigate('home')} onGoSettings={() => navigate('settings')} />
            <div className='app-body'>
              <Sidebar />
              <Canvas />
            </div>
          </div>
        )
      case 'settings':
        return (
          <SettingsPage
            workspacePath={workspacePath}
            onWorkspaceChange={(p: string) => {
              if (p) {
                setWorkspacePath(p)
                const newSettings = { ...settings, workspacePath: p }
                saveSettings(newSettings)
                setSettings(newSettings)
              }
            }}
            onThemeChange={setThemeMode}

          />
        )
      case 'zotero-projects':
        return <ProjectsPage />
      case 'about':
        return <AboutPage />
      case 'theme-store':
        return <ThemeStore />
      case 'theme-customize':
        return <ThemeCustomize />
      case 'library':
        return <LibraryPage strings={{
          library: t.library,
          librarySearch: t.librarySearch,
          libraryEmpty: t.libraryEmpty,
          libraryNoResults: t.libraryNoResults,
          back: t.back,
        }} />
      case 'presentation':
        return <PresentationView />
      default:
        return null
    }
  }


  return (
    <>
      {renderContent()}
      <Toast />
      {updateInfo && (
        <UpdateNotice
          update={updateInfo}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
      <PresentationNotes />
    </>
  )
}
