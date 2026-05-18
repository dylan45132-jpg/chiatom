import { readDir, mkdir, exists, rename, remove } from '@tauri-apps/plugin-fs'
import { documentDir, join, basename, dirname } from '@tauri-apps/api/path'

import { readZoteroIndex, updateZoteroIndex } from '../plugins/zotero/zoteroIndex'
import { readProjects, writeProjects } from '../store/projects'
import { getSettings } from '../store/settingsStore'

export interface WorkspaceFile {
  name: string
  path: string
  updatedAt: string | null
}

export interface WorkspaceFolder {
  name: string
  path: string
  files: WorkspaceFile[]
}

export interface WorkspaceStructure {
  rootFiles: WorkspaceFile[]
  folders: WorkspaceFolder[]
}

const DEFAULT_WORKSPACE_NAME = 'Chiatom'

export async function getDefaultWorkspacePath(): Promise<string> {
  const docDir = await documentDir()
  return await join(docDir, DEFAULT_WORKSPACE_NAME)
}

export async function ensureWorkspaceExists(workspacePath: string): Promise<void> {
  const workspaceExists = await exists(workspacePath)
  if (!workspaceExists) {
    await mkdir(workspacePath, { recursive: true })
  }
}

export async function readWorkspace(workspacePath: string): Promise<WorkspaceStructure> {
  await ensureWorkspaceExists(workspacePath)

  const entries = await readDir(workspacePath)

  const rootFiles: WorkspaceFile[] = []
  const folders: WorkspaceFolder[] = []

  for (const entry of entries) {
    if (!entry.name) continue

    const entryPath = await join(workspacePath, entry.name)

    if (entry.isDirectory) {
      // 跳過系統保留資料夾
      if (entry.name === 'themes') continue

      // 讀取子資料夾內的 .handout 檔案
      const subEntries = await readDir(entryPath)
      const files: WorkspaceFile[] = []

      for (const sub of subEntries) {
        if (!sub.name) continue
        if (!sub.name.endsWith('.handout')) continue
        const subPath = await join(entryPath, sub.name)
        files.push({
          name: sub.name.replace('.handout', ''),
          path: subPath,
          updatedAt: null,
        })
      }

      folders.push({
        name: entry.name,
        path: entryPath,
        files,
      })
    } else if (entry.name.endsWith('.handout')) {
      rootFiles.push({
        name: entry.name.replace('.handout', ''),
        path: entryPath,
        updatedAt: null,
      })
    }
  }

  return { rootFiles, folders }
}

export async function createWorkspaceFolder(workspacePath: string, folderName: string): Promise<string> {
  const folderPath = await join(workspacePath, folderName)
  await mkdir(folderPath, { recursive: true })
  return folderPath
}

// 移動檔案到目標資料夾（或根目錄）
export async function moveFile(filePath: string, targetFolderPath: string): Promise<string> {
  const fileName = await basename(filePath)
  const newPath = await join(targetFolderPath, fileName)
  await rename(filePath, newPath)
  return newPath
}

// 重新命名文件
export async function renameFile(filePath: string, newName: string): Promise<string> {
  const dir = await dirname(filePath)
  const newPath = await join(dir, newName + '.handout')
  await rename(filePath, newPath)

  // 同步更新 zotero index
  const workspacePath = getSettings().workspacePath
  if (workspacePath) {
    // 更新 zoteroIndex：把舊 key 搬到新 key
    const index = await readZoteroIndex(workspacePath)
    if (index[filePath]) {
      await updateZoteroIndex(workspacePath, newPath, index[filePath])
      await updateZoteroIndex(workspacePath, filePath, null)
    }

    // 更新 zoteroProjects：把所有 pageLinks 的舊 docId 換成新路徑
    const projects = await readProjects(workspacePath)
    let changed = false
    for (const project of projects) {
      for (const link of project.pageLinks) {
        if (link.docId === filePath) {
          link.docId = newPath
          changed = true
        }
      }
    }
    if (changed) {
      await writeProjects(workspacePath, projects)
    }
  }

  return newPath
}

// 重新命名資料夾
export async function renameFolder(folderPath: string, newName: string): Promise<string> {
  const dir = await dirname(folderPath)
  const newPath = await join(dir, newName)
  await rename(folderPath, newPath)
  return newPath
}

// 刪除文件
export async function deleteFile(filePath: string): Promise<void> {
  await remove(filePath)
}

// 刪除資料夾（含內容）
export async function deleteFolder(folderPath: string): Promise<void> {
  await remove(folderPath, { recursive: true })
}

// ── 主題目錄管理 ──────────────────────────

export async function getThemesPath(workspacePath: string): Promise<string> {
  return await join(workspacePath, 'themes')
}

export async function ensureThemesDirExists(workspacePath: string): Promise<void> {
  const themesPath = await getThemesPath(workspacePath)
  const themesExists = await exists(themesPath)
  if (!themesExists) {
    await mkdir(themesPath, { recursive: true })
  }
}

export async function getInstalledThemesPath(workspacePath: string): Promise<string> {
  return await join(workspacePath, 'themes', 'installedThemes.json')
}

