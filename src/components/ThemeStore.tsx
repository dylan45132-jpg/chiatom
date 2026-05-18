import { useEffect } from 'react'
import { useThemeStoreStore } from '../store/themeStoreStore'
import { useNavigationStore } from '../store/navigationStore'
import { useLangStore } from '../store/langStore'
import { getSettings } from '../store/settingsStore'
import { fetchStoreIndex, installTheme } from '../utils/themeInstaller'
import { getInstalledThemesPath, ensureThemesDirExists } from '../utils/workspace'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { toast } from '../store/toastStore'
import ThemeStoreCard from './ThemeStoreCard'
import type { StoreThemeMeta } from '../store/themeStoreStore'

const BUILTIN_IDS = ['slate', 'linen-deck']

const ALL_TAGS = ['全部', '講義', '簡報', '學術', '現代', '人文', '筆記', 'Serif', 'Sans-serif']

export default function ThemeStore() {
  const { t } = useLangStore()
  const { goBack, navigate } = useNavigationStore()
  const {
    storeThemes, fetchStatus, fetchError,
    installedRecords,
    activeTag,
    setStoreThemes, setFetchStatus, setFetchError,
    setInstalledRecords, addInstalledRecord,
    setInstalling, setActiveTag,
    isInstalled, isInstalling,
  } = useThemeStoreStore()

  useEffect(() => {
    const load = async () => {
      const workspacePath = getSettings().workspacePath
      if (workspacePath) {
        try {
          await ensureThemesDirExists(workspacePath)
          const indexPath = await getInstalledThemesPath(workspacePath)
          const raw = await readTextFile(indexPath)
          setInstalledRecords(JSON.parse(raw))
        } catch {
          setInstalledRecords([])
        }
      }

      if (fetchStatus === 'success' && storeThemes.length > 0) return
      setFetchStatus('loading')
      try {
        const themes = await fetchStoreIndex()
        setStoreThemes(themes)
        setFetchStatus('success')
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : '未知錯誤')
        setFetchStatus('error')
      }
    }
    load()
  }, [])

  const handleInstall = async (meta: StoreThemeMeta) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) {
      toast.error('找不到 workspace 路徑')
      return
    }
    setInstalling(meta.id, true)
    try {
      await installTheme(meta, workspacePath)
      addInstalledRecord({
        id: meta.id,
        name: meta.name,
        version: meta.version,
        installedAt: new Date().toISOString(),
      })
      toast.success(`${t.toastThemeApplied} ${meta.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toastImportFailed)
    } finally {
      setInstalling(meta.id, false)
    }
  }

  const filteredThemes = activeTag && activeTag !== '全部'
    ? storeThemes.filter(th => th.tags?.includes(activeTag))
    : storeThemes

  return (
    <div className='theme-store-shell'>
      <div className='theme-store-header'>
        <button className='toolbar-btn icon-btn' onClick={goBack}>←</button>
        <span className='theme-store-title'>{t.themeStoreTitle}</span>
        <div className='theme-store-header-actions'>
          <button
            className='toolbar-btn'
            onClick={() => navigate('theme-customize' as any)}
          >
            {t.themeCustomize}
          </button>
        </div>
      </div>

      <div className='theme-store-tags'>
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            className={`theme-tag-btn ${(activeTag === tag || (tag === '全部' && !activeTag)) ? 'is-active' : ''}`}
            onClick={() => setActiveTag(tag === '全部' ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className='theme-store-body'>
        {fetchStatus === 'loading' && (
          <div className='theme-store-status'>{t.themeStoreChecking}</div>
        )}
        {fetchStatus === 'error' && (
          <div className='theme-store-status is-error'>
            {t.themeStoreError}
            <br />
            <span className='theme-store-error-detail'>{fetchError}</span>
          </div>
        )}
        {fetchStatus === 'success' && filteredThemes.length === 0 && (
          <div className='theme-store-status'>{t.themeStoreEmpty}</div>
        )}
        {(fetchStatus === 'success' || fetchStatus === 'idle') && filteredThemes.length > 0 && (
          <div className='theme-store-grid'>
            {filteredThemes.map(theme => (
              <ThemeStoreCard
                key={theme.id}
                theme={theme}
                isInstalled={isInstalled(theme.id)}
                isInstalling={isInstalling(theme.id)}
                isBuiltin={BUILTIN_IDS.includes(theme.id)}
                onInstall={handleInstall}
              />
            ))}
          </div>
        )}
      </div>

      <div className='theme-store-footer'>
        <span className='theme-store-footer-info'>
          {`2 套內建 · ${installedRecords.length} 套已安裝`}
        </span>
      </div>
    </div>
  )
}