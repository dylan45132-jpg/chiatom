import { writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { getThemesPath, getInstalledThemesPath } from './workspace'
import type { StoreThemeMeta } from '../store/themeStoreStore'

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/dylan45132-jpg/chiatom-themes/main'

export async function installTheme(
  meta: StoreThemeMeta,
  workspacePath: string,
  onProgress?: (step: string) => void
): Promise<void> {
  const themesPath = await getThemesPath(workspacePath)
  const themeDir = await join(themesPath, meta.id)

  // 確保目錄存在
  const dirExists = await exists(themeDir)
  if (!dirExists) {
    await mkdir(themeDir, { recursive: true })
  }

  // fetch theme.css
  onProgress?.('下載樣式…')
  const cssUrl = `${REPO_RAW_BASE}/themes/${meta.id}/theme.css`
  const cssRes = await fetch(cssUrl)
  if (!cssRes.ok) throw new Error(`無法下載 theme.css：${cssRes.status}`)
  const css = await cssRes.text()

  // fetch theme.json
  onProgress?.('下載設定…')
  const jsonUrl = `${REPO_RAW_BASE}/themes/${meta.id}/theme.json`
  const jsonRes = await fetch(jsonUrl)
  if (!jsonRes.ok) throw new Error(`無法下載 theme.json：${jsonRes.status}`)
  const json = await jsonRes.text()

  // 寫檔
  onProgress?.('寫入本地…')
  await writeTextFile(await join(themeDir, 'theme.css'), css)
  await writeTextFile(await join(themeDir, 'theme.json'), json)

  // 更新 installedThemes.json
  const indexPath = await getInstalledThemesPath(workspacePath)
  let records: Array<{ id: string; name: string; version: string; installedAt: string; pageSize?: 'A4' | '16:9' }> = []
  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const raw = await readTextFile(indexPath)
    records = JSON.parse(raw)
  } catch {
    // 第一次安裝，清單不存在
  }

  // 更新或新增記錄
  records = records.filter(r => r.id !== meta.id)
  records.push({
    id: meta.id,
    name: meta.name,
    version: meta.version,
    pageSize: meta.pageSize,
    installedAt: new Date().toISOString(),
  })

  await writeTextFile(indexPath, JSON.stringify(records, null, 2))
}

export async function fetchStoreIndex(): Promise<StoreThemeMeta[]> {
  const indexUrl = `${REPO_RAW_BASE}/index.json`
  const res = await fetch(indexUrl)
  if (!res.ok) throw new Error(`無法載入商店清單：${res.status}`)
  const data = await res.json()
  return data.themes ?? []
}