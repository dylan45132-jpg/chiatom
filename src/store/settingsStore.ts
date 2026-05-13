import { load } from '@tauri-apps/plugin-store'

export interface Settings {
  workspacePath: string | null
  language: 'zh' | 'en'
  defaultThemeName: string
  theme: 'light' | 'dark'
  enabledPlugins: string[]
}

const SETTINGS_FILE = 'chiatom-settings.json'

const defaultSettings: Settings = {
  workspacePath: null,
  language: 'zh',
  defaultThemeName: '',
  theme: 'light',
  enabledPlugins: [],
}

let settingsCache: Settings = { ...defaultSettings }

export async function loadSettings(): Promise<Settings> {
  try {
    const store = await load(SETTINGS_FILE)
    const saved = await store.get<Settings>('settings')
    if (saved) {
      settingsCache = { ...defaultSettings, ...saved }
    } else {
      settingsCache = { ...defaultSettings }
      await store.set('settings', settingsCache)
      await store.save()
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    settingsCache = { ...defaultSettings }
  }
  return settingsCache
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const store = await load(SETTINGS_FILE)
    const newSettings = { ...settingsCache, ...settings }
    await store.set('settings', newSettings)
    await store.save()
    settingsCache = newSettings
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  }
}

export function getSettings(): Settings {
  return settingsCache
}