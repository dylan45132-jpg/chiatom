import { useLangStore } from '../../store/langStore'
import type { ChiatomPlugin } from '../registry'

export const ZoteroPlugin: ChiatomPlugin = {
  id: 'zotero',
  name: () => useLangStore.getState().t.zoteroPluginName,
  description: () => useLangStore.getState().t.zoteroPluginDesc,
}