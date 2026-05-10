import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function getMimeType(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

export async function pickImageAsDataUrl(): Promise<{
  path: string
  dataUrl: string
} | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: '圖片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
  })

  if (!selected || Array.isArray(selected)) return null

  const bytes = await readFile(selected)
  const base64 = bytesToBase64(bytes)
  const mime = getMimeType(selected)

  return { path: selected, dataUrl: `data:${mime};base64,${base64}` }
}