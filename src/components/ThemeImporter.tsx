import { useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { importThemeFromFolder, importThemeFromCss } from '../theme/themeLoader'
import { toast } from '../store/toastStore'
import { BUILTIN_THEMES } from '../theme/builtinThemes'
import type { ThemeConfig } from '../store/documentStore'

interface ThemeImporterProps {
  onClose: () => void
}

export default function ThemeImporter({ onClose }: ThemeImporterProps) {
  const { setTheme, document } = useDocumentStore()
  const [tab, setTab] = useState<'builtin' | 'folder' | 'paste'>('builtin')
  const [cssText, setCssText] = useState('')
  const [themeName, setThemeName] = useState('自訂主題')
  const [loading, setLoading] = useState(false)

  const handleApplyBuiltinTheme = (theme: typeof BUILTIN_THEMES[0]) => {
    const themeConfig: ThemeConfig = {
      name: theme.name,
      css: theme.css,
      json: theme.json,
    }
    setTheme(themeConfig)
    toast.success(`已套用主題：${theme.name}`)
    onClose()
  }

  const handleImportFolder = async () => {
    setLoading(true)
    try {
      const theme = await importThemeFromFolder()
      if (!theme) return
      setTheme(theme)
      toast.success(`已套用主題：${theme.name}`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '匯入失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCss = () => {
    if (!cssText.trim()) {
      toast.error('請貼上 CSS 內容')
      return
    }
    const theme = importThemeFromCss(cssText, themeName)
    setTheme(theme)
    toast.success(`已套用主題：${theme.name}`)
    onClose()
  }

  const handleReset = () => {
    setTheme({
      name: '預設主題',
      css: '',
      json: { name: '預設主題', version: '1.0.0', author: '', description: '', pageSize: 'A4', blocks: [] },
    })
    toast.info('已重設為預設主題')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">主題設定</span>
          <span className="modal-current">目前：{document.theme.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'builtin' ? 'is-active' : ''}`}
            onClick={() => setTab('builtin')}
          >
            內建主題
          </button>
          <button
            className={`modal-tab ${tab === 'folder' ? 'is-active' : ''}`}
            onClick={() => setTab('folder')}
          >
            資料夾匯入
          </button>
          <button
            className={`modal-tab ${tab === 'paste' ? 'is-active' : ''}`}
            onClick={() => setTab('paste')}
          >
            貼上 CSS
          </button>
        </div>

        <div className="modal-body">
          {tab === 'builtin' && (
            <div className="modal-section builtin-themes-list">
              {BUILTIN_THEMES.map(theme => (
                <div key={theme.id} className="builtin-theme-item">
                  <div className="builtin-theme-info">
                    <span className="builtin-theme-name">{theme.name}</span>
                    <p className="builtin-theme-desc">{theme.description}</p>
                  </div>
                  <button
                    className="modal-btn"
                    onClick={() => handleApplyBuiltinTheme(theme)}
                  >
                    套用
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'folder' && (
            <div className="modal-section">
              <p className="modal-desc">
                選取包含 <code>theme.css</code> 和 <code>theme.json</code> 的主題資料夾。
              </p>
              <button
                className="modal-btn-primary"
                onClick={handleImportFolder}
                disabled={loading}
              >
                {loading ? '匯入中…' : '選取主題資料夾'}
              </button>
            </div>
          )}

          {tab === 'paste' && (
            <div className="modal-section">
              <input
                className="modal-input"
                value={themeName}
                onChange={e => setThemeName(e.target.value)}
                placeholder="主題名稱"
              />
              <textarea
                className="modal-textarea"
                value={cssText}
                onChange={e => setCssText(e.target.value)}
                placeholder="貼上 theme.css 內容…"
                rows={10}
              />
              <button className="modal-btn-primary" onClick={handleImportCss}>
                套用
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-ghost" onClick={handleReset}>
            重設為預設主題
          </button>
        </div>
      </div>
    </div>
  )
}