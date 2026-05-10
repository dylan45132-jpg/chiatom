import { useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { saveHandout, loadHandout, resolveImageSrcs } from '../utils/handoutPackage'
import { exportToHtml } from '../editor/renderer'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { toast } from '../store/toastStore'
import ThemeImporter from './ThemeImporter'

export default function Toolbar() {
  const { document, setDocumentTitle, loadFromDocument } = useDocumentStore()
  const [savePath, setSavePath] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showTheme, setShowTheme] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const path = await saveHandout(document, savePath ?? undefined)
      if (path) {
        setSavePath(path)
        toast.success('已儲存')
      }
    } catch {
      toast.error('儲存失敗')
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
        toast.success('已開啟')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '開啟失敗')
    }
  }

  const handleExport = async () => {
    try {
      const resolvedPages = await resolveImageSrcs(document.pages)
      const html = exportToHtml(resolvedPages, document.title, document.theme)
      const targetPath = await save({
        filters: [{ name: 'HTML 檔案', extensions: ['html'] }],
        defaultPath: `${document.title}.html`,
      })
      if (!targetPath) return
      await writeTextFile(targetPath, html)
      toast.success('已匯出 HTML')
    } catch {
      toast.error('匯出失敗')
    }
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
            placeholder="未命名講義"
            spellCheck={false}
          />
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={() => setShowTheme(true)}>
            主題
          </button>
          <button className="toolbar-btn" onClick={handleOpen}>
            開啟
          </button>
          <button className="toolbar-btn" onClick={handleSave} disabled={saving}>
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button className="toolbar-btn" onClick={handleExport}>
            匯出 HTML
          </button>
        </div>
      </div>

      {showTheme && <ThemeImporter onClose={() => setShowTheme(false)} />}
    </>
  )
}