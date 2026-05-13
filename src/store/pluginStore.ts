import { create } from 'zustand'
import { getSettings, saveSettings } from './settingsStore'

interface PluginStore {
  enabledPlugins: string[]
  isEnabled: (id: string) => boolean
  enablePlugin: (id: string) => Promise<void>
  disablePlugin: (id: string) => Promise<void>
  togglePlugin: (id: string) => Promise<void>
  syncFromSettings: () => void
}

export const usePluginStore = create<PluginStore>()((set, get) => ({
  enabledPlugins: getSettings().enabledPlugins,

  isEnabled: (id: string): boolean => {
    return get().enabledPlugins.includes(id)
  },

  syncFromSettings: () => {
    set({ enabledPlugins: getSettings().enabledPlugins })
  },

  enablePlugin: async (id: string): Promise<void> => {
    const current = get().enabledPlugins
    if (!current.includes(id)) {
      const updated = [...current, id]
      await saveSettings({ enabledPlugins: updated })
      set({ enabledPlugins: updated })
    }
  },

  disablePlugin: async (id: string): Promise<void> => {
    const current = get().enabledPlugins
    const updated = current.filter((p: string) => p !== id)
    await saveSettings({ enabledPlugins: updated })
    set({ enabledPlugins: updated })
  },

  togglePlugin: async (id: string): Promise<void> => {
    const current = get().enabledPlugins
    const enabled = current.includes(id)
    const updated = enabled
      ? current.filter((p: string) => p !== id)
      : [...current, id]
    await saveSettings({ enabledPlugins: updated })
    set({ enabledPlugins: updated })
  },
}))