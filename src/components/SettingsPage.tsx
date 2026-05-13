import { useState } from 'react'
import { useLangStore } from '../store/langStore'
import { open } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { saveSettings } from '../store/settingsStore'
import { getAllPlugins } from '../plugins/registry'
import { usePluginStore } from '../store/pluginStore'

interface SettingsPageProps {
  onBack: () => void
  workspacePath: string | null
  onWorkspaceChange: (path: string) => void
  onThemeChange: (mode: 'light' | 'dark') => void
}

export default function SettingsPage({ onBack, workspacePath, onWorkspaceChange, onThemeChange }: SettingsPageProps) {
  const { t, lang, setLang } = useLangStore()
  const { enabledPlugins, togglePlugin } = usePluginStore()
  const allPlugins = getAllPlugins()

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    document.documentElement.getAttribute('data-theme') as 'light' | 'dark' ?? 'light'
  )

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setCurrentTheme(mode)
    onThemeChange(mode)
  }

  const handleChangeWorkspace = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t.workspacePath,
    })
    if (typeof selected === 'string') {
      onWorkspaceChange(selected)
    }
  }

  const handleOpenGithub = async () => {
    await openUrl('https://github.com/dylan45132-jpg/chiatom')
  }

  const handleOpenThemeGallery = async () => {
    await openUrl('https://dylan45132-jpg.github.io/chiatom-themes/')
  }

  return (
    <div className='settings-shell'>
      <div className='settings-header'>
        <button className='toolbar-btn icon-btn' onClick={onBack}>←</button>
        <span className='settings-title'>{t.settingsTitle}</span>
      </div>

      <div className='settings-body'>

        <div className='settings-section'>
          <div className='settings-row'>
            <div className='settings-row-label'>
              <span className='settings-label'>{t.workspacePath}</span>
              <span className='settings-desc'>{workspacePath ?? '—'}</span>
            </div>
            <button className='toolbar-btn' onClick={handleChangeWorkspace}>
              {t.changeWorkspace}
            </button>
          </div>
        </div>

        <div className='settings-section'>
          <div className='settings-row'>
            <span className='settings-label'>{t.themeMode}</span>
            <div className='settings-toggle'>
              <button
                className={currentTheme === 'light' ? 'toolbar-btn active' : 'toolbar-btn'}
                onClick={() => handleThemeChange('light')}
              >
                {t.lightMode}
              </button>
              <button
                className={currentTheme === 'dark' ? 'toolbar-btn active' : 'toolbar-btn'}
                onClick={() => handleThemeChange('dark')}
              >
                {t.darkMode}
              </button>
            </div>
          </div>
        </div>

        <div className='settings-section'>
          <div className='settings-row'>
            <span className='settings-label'>{t.language}</span>
            <div className='settings-toggle'>
              <button
                className={lang === 'zh' ? 'toolbar-btn active' : 'toolbar-btn'}
                onClick={() => { setLang('zh'); saveSettings({ language: 'zh' }) }}
              >
                中文
              </button>
              <button
                className={lang === 'en' ? 'toolbar-btn active' : 'toolbar-btn'}
                onClick={() => { setLang('en'); saveSettings({ language: 'en' }) }}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {allPlugins.length > 0 && allPlugins.map(plugin => (
          <div key={plugin.id} className='settings-section'>
            <div className='settings-row'>
              <div className='settings-row-label'>
                <span className='settings-label'>{plugin.name}</span>
                <span className='settings-desc'>{plugin.description}</span>
              </div>
              <button
                className={enabledPlugins.includes(plugin.id) ? 'toolbar-btn active' : 'toolbar-btn'}
                onClick={() => togglePlugin(plugin.id)}
              >
                {enabledPlugins.includes(plugin.id) ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}

        <div className='settings-section'>
          <div className='settings-row'>
            <span className='settings-label'>{t.github}</span>
            <button className='toolbar-btn' onClick={handleOpenGithub}>↗</button>
          </div>
          <div className='settings-row'>
            <span className='settings-label'>{t.themeGalleryLabel}</span>
            <button className='toolbar-btn' onClick={handleOpenThemeGallery}>↗</button>
          </div>
        </div>

      </div>
    </div>
  )
}