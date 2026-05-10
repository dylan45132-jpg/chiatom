import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { ThemeConfig, ThemeDefinition } from '../store/documentStore'
import { useLangStore } from '../store/langStore'

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
  const t = useLangStore.getState().t
  const selected = await open({
    directory: true,
    multiple: false,
    title: t.selectThemeFolder,
  })

  if (!selected || Array.isArray(selected)) return null
  const folderPath = selected

  // 讀取 theme.css
  let css = ''
  try {
    const cssPath = await join(folderPath, 'theme.css')
    css = await readTextFile(cssPath)
  } catch {
    throw new Error(t.errorNoCss)
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

  const name = json.name || folderPath.split(/[\\/]/).pop() || t.customTheme

  return { name, css, json: { ...json, name } }
}

// ── 從貼上的 CSS 建立主題 ─────────────────

export function importThemeFromCss(css: string, name?: string): ThemeConfig {
  const t = useLangStore.getState().t
  const themeName = name || t.customTheme
  return {
    name: themeName,
    css,
    json: { ...defaultThemeDefinition, name: themeName },
  }
}
