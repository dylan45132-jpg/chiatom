import JSZip from 'jszip'
import { readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs'
import { save, open } from '@tauri-apps/plugin-dialog'
import { join, tempDir } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core'
import { Document } from '../store/documentStore'
import { Page } from '../store/documentStore'

export async function resolveImageSrcs(pages: Page[]): Promise<Page[]> {
  // 深度複製，不改原始資料
  const resolvedPages = JSON.parse(JSON.stringify(pages))
  
  async function processNode(node: any) {
    if (node.type === 'imagePlaceholder' && node.attrs?.src) {
      const src = node.attrs.src
      
      if (!src.startsWith('data:')) {
        try {
          // 從 asset URL 解析出真實檔案路徑
          // http://asset.localhost/C%3A%5C... → C:\Users\...
          const urlPath = new URL(src).pathname  // 取出 pathname 部分
          const realPath = decodeURIComponent(urlPath).replace(/^\//, '')  // decode + 移除開頭的 /
          
          const bytes = await readFile(realPath)
          const ext = realPath.split('.').pop()?.toLowerCase() || 'png'
          const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
          const mime = mimeMap[ext] || 'image/png'
          const base64 = btoa(String.fromCharCode(...Array.from(bytes)))
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

// ── 暫存目錄管理 ──────────────────────────

export async function getTempDir(docId: string): Promise<string> {
  const temp = await tempDir()
  const dir = await join(temp, 'chiatom', docId)
  await mkdir(dir, { recursive: true })
  return dir
}

// ── 圖片工具 ──────────────────────────────

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

// ── 儲存 .handout ─────────────────────────

export async function saveHandout(
  doc: Document,
  filePath?: string
): Promise<string | null> {
  const zip = new JSZip()
  const assets = zip.folder('assets')!

  // 處理圖片：把 base64 提取出來存進 zip，JSON 改存相對路徑
  const docCopy = JSON.parse(JSON.stringify(doc)) as Document
  const imageMap = new Map<string, string>() // dataUrl → assets/xxx.png

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
    filters: [{ name: 'Chiatom 講義', extensions: ['handout'] }],
    defaultPath: `${doc.title}.handout`,
  })

  if (!targetPath) return null
  const finalPath = targetPath.endsWith('.handout') ? targetPath : `${targetPath}.handout`
  await writeFile(finalPath, bytes)
  return finalPath
}

// ── 開啟 .handout ─────────────────────────

export async function loadHandout(): Promise<{
  doc: Document
  tempPath: string
} | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Chiatom 講義', extensions: ['handout'] }],
  })

  if (!selected || Array.isArray(selected)) return null

  const bytes = await readFile(selected)
  const zip = await JSZip.loadAsync(bytes)

  // 讀取 document.json
  const docEntry = zip.file('document.json')
  if (!docEntry) throw new Error('無效的 .handout 檔案')
  const docText = await docEntry.async('string')
  const doc = JSON.parse(docText) as Document

  // 解壓圖片到暫存目錄
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

  // 把 doc 裡的相對路徑換成暫存目錄絕對路徑
  const processNode = async (node: any) => {
    if (!node) return
    if (
      node.type === 'imagePlaceholder' &&
      node.attrs?.src?.startsWith('assets/')
    ) {
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