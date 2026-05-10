import { useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { importThemeFromFolder, importThemeFromCss } from '../theme/themeLoader'
import { toast } from '../store/toastStore'
import { getBuiltinThemes } from '../theme/builtinThemes'
import type { ThemeConfig } from '../store/documentStore'
import { useLangStore } from '../store/langStore'

interface ThemeImporterProps {
  onClose: () => void
}

export default function ThemeImporter({ onClose }: ThemeImporterProps) {
  const { t } = useLangStore()
  const { setTheme, document } = useDocumentStore()
  const [tab, setTab] = useState<'builtin' | 'folder' | 'paste'>('builtin')
  const [cssText, setCssText] = useState('')
  const [themeName, setThemeName] = useState(t.customTheme)
  const [loading, setLoading] = useState(false)
  const BUILTIN_THEMES = getBuiltinThemes()

  const handleApplyBuiltinTheme = (theme: (typeof BUILTIN_THEMES)[0]) => {
    const themeConfig: ThemeConfig = {
      name: theme.name,
      css: theme.css,
      json: theme.json,
    }
    setTheme(themeConfig)
    toast.success(`${t.toastThemeApplied} ${theme.name}`)
    onClose()
  }

  const handleImportFolder = async () => {
    setLoading(true)
    try {
      const theme = await importThemeFromFolder()
      if (!theme) return
      setTheme(theme)
      toast.success(`${t.toastThemeApplied} ${theme.name}`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toastImportFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleImportCss = () => {
    if (!cssText.trim()) {
      toast.error(t.toastNoCss)
      return
    }
    const theme = importThemeFromCss(cssText, themeName)
    setTheme(theme)
    toast.success(`${t.toastThemeApplied} ${theme.name}`)
    onClose()
  }

  const handleReset = () => {
    setTheme({
      name: t.defaultThemeName,
      css: '',
      json: { name: t.defaultThemeName, version: '1.0.0', author: '', description: '', pageSize: 'A4', blocks: [] },
    })
    toast.info(t.toastReset)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{t.themeSettings}</span>
          <span className="modal-current">{t.currentTheme}{document.theme.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'builtin' ? 'is-active' : ''}`}
            onClick={() => setTab('builtin')}
          >
            {t.builtinThemes}
          </button>
          <button
            className={`modal-tab ${tab === 'folder' ? 'is-active' : ''}`}
            onClick={() => setTab('folder')}
          >
            {t.folderImport}
          </button>
          <button
            className={`modal-tab ${tab === 'paste' ? 'is-active' : ''}`}
            onClick={() => setTab('paste')}
          >
            {t.pasteCSS}
          </button>
        </div>

        <div className="modal-body">
          {tab === 'builtin' && (
            <div className="modal-section builtin-themes-list">
              {getBuiltinThemes().map(theme => (
                <div key={theme.id} className="builtin-theme-item">
                  <div className="builtin-theme-info">
                    <span className="builtin-theme-name">{theme.name}</span>
                    <p className="builtin-theme-desc">{theme.description}</p>
                  </div>
                  <button
                    className="modal-btn"
                    onClick={() => handleApplyBuiltinTheme(theme)}
                  >
                    {t.applyTheme}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'folder' && (
            <div className="modal-section">
              <p className="modal-desc">
                {t.folderHint}
              </p>
              <button
                className="modal-btn-primary"
                onClick={handleImportFolder}
                disabled={loading}
              >
                {loading ? t.selectingFolder : t.selectFolder}
              </button>
            </div>
          )}

          {tab === 'paste' && (
            <div className="modal-section">
              <input
                className="modal-input"
                value={themeName}
                onChange={e => setThemeName(e.target.value)}
                placeholder={t.themeNamePlaceholder}
              />
              <textarea
                className="modal-textarea"
                value={cssText}
                onChange={e => setCssText(e.target.value)}
                placeholder={t.cssPastePlaceholder}
                rows={10}
              />
              <button className="modal-btn-primary" onClick={handleImportCss}>
                {t.applyTheme}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-ghost" onClick={handleReset}>
            {t.resetTheme}
          </button>
        </div>
      </div>
    </div>
  )
}
