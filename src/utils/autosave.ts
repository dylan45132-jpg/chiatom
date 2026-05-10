import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'
import { save, open } from '@tauri-apps/plugin-dialog'
import { Document } from '../store/documentStore'

// ── 儲存 ──────────────────────────────────

export async function saveDocument(doc: Document, filePath?: string): Promise<string | null> {
  try {
    const json = JSON.stringify(doc, null, 2)

    // 如果有路徑就直接存，否則開 Save As 對話框
    const targetPath = filePath ?? await save({
      filters: [{ name: 'Chiatom 文件', extensions: ['json'] }],
      defaultPath: `${doc.title}.json`,
    })

    if (!targetPath) return null // 使用者取消

    await writeTextFile(targetPath, json)
    return targetPath
  } catch (err) {
    console.error('儲存失敗', err)
    throw err
  }
}

// ── 開啟 ──────────────────────────────────

export async function loadDocument(): Promise<Document | null> {
  try {
    const selected = await open({
      filters: [{ name: 'Chiatom 文件', extensions: ['json'] }],
      multiple: false,
    })

    if (!selected) return null

    const filePath = Array.isArray(selected) ? selected[0] : selected
    const raw = await readTextFile(filePath)
    return JSON.parse(raw) as Document
  } catch (err) {
    console.error('開啟失敗', err)
    throw err
  }
}