import type { Extensions } from '@tiptap/core'

import { ZoteroPlugin } from './zotero/index'

// Plugin 介面定義
export interface ChiatomPlugin {
  id: string
  name: () => string
  description: () => string
  extensions?: () => Extensions
  slashItems?: () => unknown[]
}

// 內建 plugin 清單（目前為空，Zotero plugin 之後加入）
const registry: ChiatomPlugin[] = [ZoteroPlugin]

// 取得所有已啟用 plugin 的 Tiptap extensions
export function getEnabledExtensions(enabledPluginIds: string[]): Extensions {
  return registry
    .filter(p => enabledPluginIds.includes(p.id))
    .flatMap(p => p.extensions ? p.extensions() : [])
}

// 取得所有已啟用 plugin 的 slash items
export function getEnabledSlashItems(enabledPluginIds: string[]): unknown[] {
  return registry
    .filter(p => enabledPluginIds.includes(p.id))
    .flatMap(p => p.slashItems ? p.slashItems() : [])
}

// 取得完整 plugin 清單（給設定頁用）
export function getAllPlugins(): ChiatomPlugin[] {
  return registry
}