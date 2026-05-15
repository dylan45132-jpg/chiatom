import { invoke } from '@tauri-apps/api/core'
import { useDocumentStore } from '../../store/documentStore'

export interface ZoteroMeta {
  citekey: string
  paperTitle: string
  firstAuthor?: string
  year?: string
  venue?: string
}

const PLUGIN_ID = 'zotero'

export function getZoteroMeta(): ZoteroMeta | null {
  const doc = useDocumentStore.getState().document
  if (!doc?.pluginData?.[PLUGIN_ID]) return null
  return doc.pluginData[PLUGIN_ID] as ZoteroMeta
}

export function setZoteroMeta(meta: Partial<ZoteroMeta>): void {
  const store = useDocumentStore.getState()
  const doc = store.document
  if (!doc) return
  const current = (doc.pluginData?.[PLUGIN_ID] ?? {}) as ZoteroMeta
  const updated = { ...current, ...meta }
  store.setPluginData(PLUGIN_ID, updated)
}

export async function searchZotero(query: string): Promise<ZoteroMeta[]> {
  try {
    const data = await invoke<{ result?: Record<string, unknown>[] }>('search_zotero', { query })
    if (!data.result) return []
    const mapped = data.result.map((item: Record<string, unknown>) => {
      const authors = item['author'] as { family?: string; given?: string }[] | undefined
      const firstAuthor = authors?.[0]?.family ?? ''
      const issued = item['issued'] as { 'date-parts'?: number[][] } | undefined
      const year = issued?.['date-parts']?.[0]?.[0]?.toString() ?? ''
      const venue = (item['journalAbbreviation'] as string) || (item['container-title'] as string) || ''
      return {
        citekey: (item['citation-key'] ?? item['citekey'] ?? '') as string,
        paperTitle: (item['title'] as string) ?? '',
        firstAuthor,
        year,
        venue,
      }
    })
    return mapped
  } catch (e) {
    console.error('[Zotero] error:', e)
    return []
  }
}
