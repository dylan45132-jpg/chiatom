import { create } from 'zustand'

export interface StoreThemeMeta {
  id: string
  name: string
  description: string
  pageSize: 'A4' | '16:9'
  tags: string[]
  palette: string[]
  preview: string
  download: string
  version: string
  author: string
}

interface InstalledRecord {
  id: string
  name: string
  version: string
  installedAt: string
}

interface ThemeStoreState {
  // 商店資料
  storeThemes: StoreThemeMeta[]
  fetchStatus: 'idle' | 'loading' | 'success' | 'error'
  fetchError: string | null

  // 已安裝清單
  installedRecords: InstalledRecord[]

  // 安裝狀態：key 為 theme id，value 為安裝進度
  installingIds: Set<string>

  // 篩選
  activeTag: string | null

  // actions
  setStoreThemes: (themes: StoreThemeMeta[]) => void
  setFetchStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void
  setFetchError: (err: string | null) => void
  setInstalledRecords: (records: InstalledRecord[]) => void
  addInstalledRecord: (record: InstalledRecord) => void
  setInstalling: (id: string, installing: boolean) => void
  setActiveTag: (tag: string | null) => void
  isInstalled: (id: string) => boolean
  isInstalling: (id: string) => boolean
}

export const useThemeStoreStore = create<ThemeStoreState>((set, get) => ({
  storeThemes: [],
  fetchStatus: 'idle',
  fetchError: null,
  installedRecords: [],
  installingIds: new Set(),
  activeTag: null,

  setStoreThemes: (themes) => set({ storeThemes: themes }),
  setFetchStatus: (status) => set({ fetchStatus: status }),
  setFetchError: (err) => set({ fetchError: err }),
  setInstalledRecords: (records) => set({ installedRecords: records }),

  addInstalledRecord: (record) => set((state) => ({
    installedRecords: [
      ...state.installedRecords.filter(r => r.id !== record.id),
      record,
    ],
  })),

  setInstalling: (id, installing) => set((state) => {
    const next = new Set(state.installingIds)
    if (installing) next.add(id)
    else next.delete(id)
    return { installingIds: next }
  }),

  setActiveTag: (tag) => set({ activeTag: tag }),

  isInstalled: (id) => get().installedRecords.some(r => r.id === id),
  isInstalling: (id) => get().installingIds.has(id),
}))