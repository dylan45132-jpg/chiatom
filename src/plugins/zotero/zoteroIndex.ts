import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

const INDEX_FILENAME = '.zotero-index.json'

export interface ZoteroIndexEntry {
  citekey: string
  paperTitle: string
  tags: string[]
}

export type ZoteroIndex = Record<string, ZoteroIndexEntry>

export async function readZoteroIndex(workspacePath: string): Promise<ZoteroIndex> {
  try {
    const indexPath = await join(workspacePath, INDEX_FILENAME)
    const fileExists = await exists(indexPath)
    if (!fileExists) return {}
    const content = await readTextFile(indexPath)
    return JSON.parse(content) as ZoteroIndex
  } catch {
    return {}
  }
}

export async function updateZoteroIndex(
  workspacePath: string,
  filePath: string,
  entry: ZoteroIndexEntry | null
): Promise<void> {
  try {
    const indexPath = await join(workspacePath, INDEX_FILENAME)
    const index = await readZoteroIndex(workspacePath)
    if (entry === null) {
      delete index[filePath]
    } else {
      index[filePath] = entry
    }
    await writeTextFile(indexPath, JSON.stringify(index, null, 2))
  } catch (e) {
    console.error('Failed to update zotero index:', e)
  }
}