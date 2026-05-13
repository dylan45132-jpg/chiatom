import { useState } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { saveHandout, resolveImageSrcs } from '../utils/handoutPackage'
import { exportToHtml } from '../editor/renderer'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { toast } from '../store/toastStore'
import ThemeImporter from './ThemeImporter'
import { useLangStore } from '../store/langStore'
import { usePluginStore } from '../store/pluginStore'
import ZoteroToolbar from '../plugins/zotero/ZoteroToolbar'

interface ToolbarProps {
  onGoHome: () => void
  onGoSettings: () => void
}

export default function Toolbar({ onGoHome, onGoSettings }: ToolbarProps) {
  const { document, setDocumentTitle, savePath, setSavePath, isDirty, setDirty } = useDocumentStore()
  const { t } = useLangStore()
  const { enabledPlugins } = usePluginStore()
  const [saving, setSaving] = useState(false)
  const [showTheme, setShowTheme] = useState(false)

  const handleSave = async () => {
    if (saving || (!isDirty && savePath)) return
    setSaving(true)
    try {
      const returnedPath = await saveHandout(document, savePath ?? undefined)
      if (returnedPath) {
        setSavePath(returnedPath)
        setDirty(false)
        toast.success(t.toastSaved)
      }
    } catch {
      toast.error(t.toastSaveFailed)
    } finally {
      setSaving(false)
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

  const renderSaveStatus = () => {
    if (saving) {
      return <span className="toolbar-text">{t.saving}...</span>
    }
    if (!savePath) {
      return (
        <>
                    <button className="toolbar-btn" onClick={handleSave}>{t.save}</button>
          <span className="toolbar-text secondary">{t.unsaved}</span>
        </>
      )
    }
    if (isDirty) {
      return (
                <button className="toolbar-btn quiet dark" onClick={handleSave}>
          ● {t.save}
        </button>
      )
    }
        return <span className="toolbar-text secondary">{t.saved}</span>
  }

  return (
    <>
            <div className="toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-btn" onClick={onGoHome} title="Home">⌂</button>
        </div>
        <div className="toolbar-center">
          <input
            className="toolbar-title"
            value={document.title}
            onChange={e => setDocumentTitle(e.target.value)}
            placeholder={t.untitledDocument}
            spellCheck={false}
          />
          {enabledPlugins.includes('zotero') && <ZoteroToolbar />}
        </div>
        <div className="toolbar-right">
          {renderSaveStatus()}
          <button className="toolbar-btn" onClick={() => setShowTheme(true)}>{t.theme}</button>
          <button className="toolbar-btn" onClick={handleExport}>{t.exportHtml}</button>
          <button className="toolbar-btn icon-btn" onClick={onGoSettings} title="Settings">⚙</button>
        </div>
      </div>
      {showTheme && <ThemeImporter onClose={() => setShowTheme(false)} />}
    </>
  )
}
