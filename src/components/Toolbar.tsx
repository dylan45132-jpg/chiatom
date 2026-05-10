import { useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { saveHandout, loadHandout, resolveImageSrcs } from '../utils/handoutPackage'
import { exportToHtml } from '../editor/renderer'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { toast } from '../store/toastStore'
import ThemeImporter from './ThemeImporter'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useLangStore } from '../store/langStore'

export default function Toolbar() {
  const { document, setDocumentTitle, loadFromDocument } = useDocumentStore()
  const { t, toggleLang, lang } = useLangStore()
  const [savePath, setSavePath] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showTheme, setShowTheme] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const path = await saveHandout(document, savePath ?? undefined)
      if (path) {
        setSavePath(path)
        toast.success(t.toastSaved)
      }
    } catch {
      toast.error(t.toastSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleOpen = async () => {
    try {
      const result = await loadHandout()
      if (result) {
        loadFromDocument(result.doc)
        setSavePath(null)
        toast.success(t.toastOpened)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toastOpenFailed)
    }
  }

  const handleExport = async () => {
    try {
      const resolvedPages = await resolveImageSrcs(document.pages)
      const html = exportToHtml(resolvedPages, document.title, document.theme)
      const targetPath = await save({
        filters: [{ name: t.filterHtml, extensions: ['html'] }],
        defaultPath: `${document.title}.html`,
      })
      if (!targetPath) return
      await writeTextFile(targetPath, html)
      toast.success(t.toastExported)
    } catch {
      toast.error(t.toastExportFailed)
    }
  }

  const handleOpenThemes = () => {
    openUrl('https://dylan45132-jpg.github.io/chiatom-themes/')
  }

  const handleOpenGitHub = () => {
    openUrl('https://github.com/dylan45132-jpg/chiatom')
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-brand">Chiatom</span>
        </div>

        <div className="toolbar-center">
          <input
            className="toolbar-title"
            value={document.title}
            onChange={e => setDocumentTitle(e.target.value)}
            placeholder={t.untitledDocument}
            spellCheck={false}
          />
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={() => setShowTheme(true)}>
            {t.theme}
          </button>
          <button className="toolbar-btn" onClick={handleOpen}>
            {t.open}
          </button>
          <button className="toolbar-btn" onClick={handleSave} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
          <button className="toolbar-btn" onClick={handleExport}>
            {t.exportHtml}
          </button>
          <button className="toolbar-btn" onClick={handleOpenThemes}>
            {t.themeGallery}
          </button>
          <button className="toolbar-btn" onClick={handleOpenGitHub}>
            GitHub
          </button>
          <button className="toolbar-btn" onClick={toggleLang}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </div>

      {showTheme && <ThemeImporter onClose={() => setShowTheme(false)} />}
    </>
  )
}
