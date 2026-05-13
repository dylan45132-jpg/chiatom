import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  version: string
  body: string | null
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const update = await check()
    if (!update) return null
    return {
      version: update.version,
      body: update.body ?? null,
    }
  } catch {
    return null
  }
}

export async function downloadAndInstall(
  onProgress?: (downloaded: number, total: number | null) => void
): Promise<void> {
  const update = await check()
  if (!update) return
  let total: number | null = null
  let downloaded = 0
  await update.downloadAndInstall(event => {
    if (event.event === 'Started') {
      total = event.data.contentLength ?? null
    } else if (event.event === 'Progress') {
      downloaded += event.data.chunkLength
      onProgress?.(downloaded, total)
    }
  })
  await relaunch()
}