import JSZip from 'jszip'
import { readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs'
import { save, open } from '@tauri-apps/plugin-dialog'
import { join, tempDir } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core'
import { Document, Page } from '../store/documentStore'
import { useLangStore } from '../store/langStore'
import { getSettings } from '../store/settingsStore'
import { updateZoteroIndex } from '../plugins/zotero/zoteroIndex'

// ... (resolveImageSrcs and other utils remain the same)

export async function resolveImageSrcs(pages: Page[]): Promise<Page[]> {
  const resolvedPages = JSON.parse(JSON.stringify(pages))
  async function processNode(node: any) {
    if (node.type === 'imagePlaceholder' && node.attrs?.src) {
      const src = node.attrs.src
      if (!src.startsWith('data:')) {
        try {
          const urlPath = new URL(src).pathname
          const realPath = decodeURIComponent(urlPath).replace(/^\//, '')
          const bytes = await readFile(realPath)
          const ext = realPath.split('.').pop()?.toLowerCase() || 'png'
          const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
          const mime = mimeMap[ext] || 'image/png'
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
          }
          const base64 = btoa(binary)
          node.attrs.src = `data:${mime};base64,${base64}`
        } catch (e) {
          console.warn('圖片讀取失敗：', src, e)
        }
      }
    }
    if (node.content) {
      for (const child of node.content) {
        await processNode(child)
      }
    }
  }
  for (const page of resolvedPages) {
    if (page.content?.content) {
      for (const node of page.content.content) {
        await processNode(node)
      }
    }
  }
  return resolvedPages
}

export async function getTempDir(docId: string): Promise<string> {
  const temp = await tempDir()
  const dir = await join(temp, 'chiatom', docId)
  await mkdir(dir, { recursive: true })
  return dir
}

function base64ToUint8Array(base64: string): Uint8Array {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function getExtFromDataUrl(dataUrl: string): string {
  const mime = dataUrl.split(';')[0].split(':')[1] ?? 'image/png'
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mime] ?? 'png'
}

export async function saveHandout(
  doc: Document,
  filePath?: string
): Promise<string | null> {
  const t = useLangStore.getState().t
  const zip = new JSZip()
  const assets = zip.folder('assets')!
  const docCopy = JSON.parse(JSON.stringify(doc)) as Document
  const imageMap = new Map<string, string>()
  let imgIndex = 0
  const processNode = (node: any) => {
    if (!node) return
    if (node.type === 'imagePlaceholder' && node.attrs?.src?.startsWith('data:')) {
      const dataUrl = node.attrs.src
      if (!imageMap.has(dataUrl)) {
        const ext = getExtFromDataUrl(dataUrl)
        const filename = `img-${String(imgIndex++).padStart(3, '0')}.${ext}`
        imageMap.set(dataUrl, `assets/${filename}`)
        const bytes = base64ToUint8Array(dataUrl)
        assets.file(filename, bytes)
      }
      node.attrs.src = imageMap.get(dataUrl)!
      node.attrs.filePath = node.attrs.src
    }
    if (node.content) node.content.forEach(processNode)
  }
  docCopy.pages.forEach(page => processNode(page.content))
  zip.file('document.json', JSON.stringify(docCopy, null, 2))
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  const targetPath = filePath ?? await save({
    filters: [{ name: t.filterDocument, extensions: ['handout'] }],
    defaultPath: `${doc.title}.handout`,
  })
  if (!targetPath) return null
  const finalPath = targetPath.endsWith('.handout') ? targetPath : `${targetPath}.handout`
  await writeFile(finalPath, bytes)

  // 更新 Zotero index
  try {
    const settings = getSettings()
    if (settings.workspacePath && targetPath) {
      const zoteroData = doc.pluginData?.['zotero'] as { citekey?: string; paperTitle?: string; tags?: string[] } | undefined
      if (zoteroData?.citekey) {
        await updateZoteroIndex(settings.workspacePath, targetPath, {
          citekey: zoteroData.citekey,
          paperTitle: zoteroData.paperTitle ?? '',
          tags: zoteroData.tags ?? [],
        })
      } else {
        await updateZoteroIndex(settings.workspacePath, targetPath, null)
      }
    }
  } catch {
    // index 更新失敗不影響主流程
  }

  return finalPath
}

// ── 開啟 .handout ─────────────────────────

export async function loadHandoutFromPath(path: string): Promise<{ doc: Document; tempPath: string } | null> {
  const bytes = await readFile(path)
  const zip = await JSZip.loadAsync(bytes)

  const docEntry = zip.file('document.json')
  if (!docEntry) throw new Error('Invalid .handout file')
  const docText = await docEntry.async('string')
  const doc = JSON.parse(docText) as Document

  const tempPath = await getTempDir(doc.id)

  const imageFiles = Object.keys(zip.files).filter(
    name => name.startsWith('assets/') && !zip.files[name].dir
  )

  await Promise.all(imageFiles.map(async (zipPath) => {
    const entry = zip.file(zipPath)
    if (!entry) return
    const imgBytes = await entry.async('uint8array')
    const filename = zipPath.replace('assets/', '')
    const destPath = await join(tempPath, filename)
    await writeFile(destPath, imgBytes)
  }))

  const processNode = async (node: any) => {
    if (!node) return
    if (node.type === 'imagePlaceholder' && node.attrs?.src?.startsWith('assets/')) {
      const filename = node.attrs.src.replace('assets/', '')
      const absPath = await join(tempPath, filename)
      node.attrs.src = convertFileSrc(absPath)
      node.attrs.filePath = absPath
    }
    if (node.content) {
      await Promise.all(node.content.map(processNode))
    }
  }

  await Promise.all(doc.pages.map(page => processNode(page.content)))

  return { doc, tempPath }
}

export async function loadHandout(): Promise<{ doc: Document; tempPath: string } | null> {
  const t = useLangStore.getState().t
  const selected = await open({
    multiple: false,
    filters: [{ name: t.filterDocument, extensions: ['handout'] }],
  })

  if (typeof selected === 'string') {
    return await loadHandoutFromPath(selected)
  }

  return null
}

// ── 輕量讀取：只取 document.json，不處理圖片 ─────────────

export async function readHandoutMeta(path: string): Promise<{ id: string; title: string; pages: { id: string; title: string }[] } | null> {
  try {
    const bytes = await readFile(path)
    const zip = await JSZip.loadAsync(bytes)
    const docEntry = zip.file('document.json')
    if (!docEntry) return null
    const docText = await docEntry.async('string')
    const doc = JSON.parse(docText) as { id: string; title: string; pages: { id: string; title: string }[] }
    return {
      id: doc.id,
      title: doc.title,
      pages: doc.pages.map(p => ({ id: p.id, title: p.title })),
    }
  } catch {
    return null
  }
}