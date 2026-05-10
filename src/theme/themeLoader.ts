import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { ThemeConfig, ThemeDefinition } from '../store/documentStore'

const defaultThemeDefinition: ThemeDefinition = {
  name: '',
  version: '1.0.0',
  author: '',
  description: '',
  pageSize: 'A4',
  blocks: [],
}

// ── 從資料夾匯入主題 ──────────────────────

export async function importThemeFromFolder(): Promise<ThemeConfig | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: '選取主題資料夾',
  })

  if (!selected || Array.isArray(selected)) return null
  const folderPath = selected

  // 讀取 theme.css
  let css = ''
  try {
    const cssPath = await join(folderPath, 'theme.css')
    css = await readTextFile(cssPath)
  } catch {
    throw new Error('找不到 theme.css，請確認資料夾內有此檔案')
  }

  // 讀取 theme.json（可選）
  let json: ThemeDefinition = { ...defaultThemeDefinition }
  try {
    const jsonPath = await join(folderPath, 'theme.json')
    const raw = await readTextFile(jsonPath)
    json = { ...defaultThemeDefinition, ...JSON.parse(raw) }
  } catch {
    // theme.json 不存在時用預設值，不報錯
  }

  const name = json.name || folderPath.split(/[\\/]/).pop() || '自訂主題'

  return { name, css, json: { ...json, name } }
}

// ── 從貼上的 CSS 建立主題 ─────────────────

export function importThemeFromCss(css: string, name = '自訂主題'): ThemeConfig {
  return {
    name,
    css,
    json: { ...defaultThemeDefinition, name },
  }
}