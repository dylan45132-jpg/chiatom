import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { readProjects } from '../store/projects'
import type { JSONContent } from '@tiptap/core'
import type { Document } from '../store/documentStore'

// ─── 型別定義 ───────────────────────────────────────────

export interface PageRef {
  docId: string
  pageId: string
  docTitle: string
  pageTitle: string
}

export interface LibraryPageEntry {
  docId: string
  docTitle: string
  pageId: string        // 空字串代表文件層級 entry
  pageTitle: string
  preview: string
  projectIds: string[]
  referencedBy: PageRef[]
  references: PageRef[] // 此頁引用了哪些頁面／文件
  updatedAt: string
}

export interface LibraryIndex {
  version: string
  entries: Record<string, LibraryPageEntry>
  updatedAt: string
}

// ─── Index 讀寫 ──────────────────────────────────────────

const INDEX_FILENAME = '.library-index.json'

function emptyIndex(): LibraryIndex {
  return { version: '1', entries: {}, updatedAt: new Date().toISOString() }
}

export async function loadLibraryIndex(workspacePath: string): Promise<LibraryIndex> {
  try {
    const indexPath = await join(workspacePath, INDEX_FILENAME)
    const fileExists = await exists(indexPath)
    if (!fileExists) return emptyIndex()
    const raw = await readTextFile(indexPath)
    return JSON.parse(raw) as LibraryIndex
  } catch {
    return emptyIndex()
  }
}

export async function saveLibraryIndex(workspacePath: string, index: LibraryIndex): Promise<void> {
  try {
    const indexPath = await join(workspacePath, INDEX_FILENAME)
    index.updatedAt = new Date().toISOString()
    await writeTextFile(indexPath, JSON.stringify(index, null, 2))
  } catch (e) {
    console.error('[LibraryIndex] 寫入失敗', e)
  }
}

// ─── JSON 遍歷工具 ───────────────────────────────────────

type NodeVisitor = (node: JSONContent) => void

function walkJSON(node: JSONContent, visitor: NodeVisitor): void {
  visitor(node)
  if (node.content) {
    for (const child of node.content) {
      walkJSON(child, visitor)
    }
  }
}

// ─── Preview 提取 ────────────────────────────────────────

function extractTextFromNode(node: JSONContent): string {
  let text = ''
  walkJSON(node, (n) => {
    if (n.type === 'text' && typeof n.text === 'string') {
      text += n.text
    }
  })
  return text
}

export function extractPreview(content: JSONContent): string {
  return extractTextFromNode(content).slice(0, 200)
}

// ─── PageReference 提取 ──────────────────────────────────

interface PageRefRaw {
  sourcePageId: string
  targetDocId: string
  targetPageId: string  // 空字串代表引用整份文件
}

export function extractPageRefs(doc: Document): PageRefRaw[] {
  const refs: PageRefRaw[] = []
  for (const page of doc.pages) {
    walkJSON(page.content, (node) => {
      if (node.type === 'pageReference' && node.attrs?.docId) {
        refs.push({
          sourcePageId: page.id,
          targetDocId: node.attrs.docId as string,
          targetPageId: (node.attrs.pageId as string) || '',
        })
      }
    })
  }
  return refs
}

// ─── 專案歸屬查詢 ────────────────────────────────────────

async function getPageProjects(workspacePath: string, docId: string, pageId: string): Promise<string[]> {
  try {
    const projects = await readProjects(workspacePath)
    const ids: string[] = []
    for (const project of projects) {
      const linked = project.pageLinks?.some(
        (p: { docId: string; pageId: string }) => p.docId === docId && p.pageId === pageId
      )
      if (linked) ids.push(project.id)
    }
    return ids
  } catch {
    return []
  }
}

// ─── 清除某文件的所有外向引用 ───────────────────────────

function clearOutboundRefs(index: LibraryIndex, docId: string): void {
  for (const entry of Object.values(index.entries)) {
    entry.referencedBy = entry.referencedBy.filter((ref) => ref.docId !== docId)
  }
}

// ─── 主更新函式 ──────────────────────────────────────────

export async function updateLibraryIndex(
  workspacePath: string,
  doc: Document,
  savePath: string
): Promise<void> {
  if (!savePath) return

  const index = await loadLibraryIndex(workspacePath)
  const refs = extractPageRefs(doc)

  // 1. 確保文件層級 entry 存在（key: `${savePath}::`）
  const docKey = `${savePath}::`
  index.entries[docKey] = {
    docId: savePath,
    docTitle: doc.title,
    pageId: '',
    pageTitle: doc.title,
    preview: '',
    projectIds: [],
    referencedBy: index.entries[docKey]?.referencedBy ?? [],
    references: [],
    updatedAt: new Date().toISOString(),
  }

  // 2. 更新當前文件所有頁面的 entry
  for (const page of doc.pages) {
    const key = `${savePath}::${page.id}`
    const projectIds = await getPageProjects(workspacePath, savePath, page.id)

    // 計算此頁的 outbound references
    const pageRefs = refs.filter((r) => r.sourcePageId === page.id)
    const references: PageRef[] = pageRefs.map((r) => {
      if (r.targetPageId) {
        const targetEntry = index.entries[`${r.targetDocId}::${r.targetPageId}`]
        return {
          docId: r.targetDocId,
          pageId: r.targetPageId,
          docTitle: targetEntry?.docTitle ?? '',
          pageTitle: targetEntry?.pageTitle ?? '',
        }
      } else {
        const targetDocEntry = index.entries[`${r.targetDocId}::`]
        return {
          docId: r.targetDocId,
          pageId: '',
          docTitle: targetDocEntry?.docTitle ?? '',
          pageTitle: targetDocEntry?.docTitle ?? '',
        }
      }
    })

    index.entries[key] = {
      docId: savePath,
      docTitle: doc.title,
      pageId: page.id,
      pageTitle: page.title,
      preview: extractPreview(page.content),
      projectIds,
      referencedBy: index.entries[key]?.referencedBy ?? [],
      references,
      updatedAt: new Date().toISOString(),
    }
  }

  // 3. 清除當前文件的舊外向引用，重新建立反向索引
  clearOutboundRefs(index, savePath)
  for (const ref of refs) {
    const sourcePageTitle = doc.pages.find((p) => p.id === ref.sourcePageId)?.title ?? ''
    const refEntry: PageRef = {
      docId: savePath,
      pageId: ref.sourcePageId,
      docTitle: doc.title,
      pageTitle: sourcePageTitle,
    }

    if (ref.targetPageId) {
      // 引用特定頁面
      const targetKey = `${ref.targetDocId}::${ref.targetPageId}`
      if (index.entries[targetKey]) {
        index.entries[targetKey].referencedBy.push(refEntry)
      }
    } else {
      // 引用整份文件：只標記在文件層級 entry
      const targetDocKey = `${ref.targetDocId}::`
      if (index.entries[targetDocKey]) {
        index.entries[targetDocKey].referencedBy.push(refEntry)
      }
    }
  }

  await saveLibraryIndex(workspacePath, index)
}

// ─── 文件重新命名時同步 index ────────────────────────────

export async function renameDocInIndex(
  workspacePath: string,
  oldPath: string,
  newPath: string,
  newTitle: string
): Promise<void> {
  const index = await loadLibraryIndex(workspacePath)
  const newEntries: Record<string, LibraryPageEntry> = {}

  for (const [key, entry] of Object.entries(index.entries)) {
    if (entry.docId === oldPath) {
      const newKey = `${newPath}::${entry.pageId}`
      newEntries[newKey] = { ...entry, docId: newPath, docTitle: newTitle }
    } else {
      newEntries[key] = {
        ...entry,
        referencedBy: entry.referencedBy.map((ref) =>
          ref.docId === oldPath ? { ...ref, docId: newPath, docTitle: newTitle } : ref
        ),
        references: entry.references?.map((ref) =>
          ref.docId === oldPath ? { ...ref, docId: newPath, docTitle: newTitle } : ref
        ) ?? [],
      }
    }
  }

  index.entries = newEntries
  await saveLibraryIndex(workspacePath, index)
}

// ─── 文件刪除時清理 index ────────────────────────────────

export async function removeDocFromIndex(
  workspacePath: string,
  docPath: string
): Promise<void> {
  const index = await loadLibraryIndex(workspacePath)

  for (const key of Object.keys(index.entries)) {
    if (index.entries[key].docId === docPath) {
      delete index.entries[key]
    }
  }

  clearOutboundRefs(index, docPath)

  await saveLibraryIndex(workspacePath, index)
}