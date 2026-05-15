import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

const PROJECTS_FILENAME = '.projects.json'

export interface PageLink {
  docId: string
  pageId: string
  role: string
  note?: string
}

export interface Project {
  id: string
  name: string
  createdAt: string
  pageLinks: PageLink[]
}

export interface ProjectsFile {
  projects: Project[]
}

export async function readProjects(workspacePath: string): Promise<Project[]> {
  try {
    const filePath = await join(workspacePath, PROJECTS_FILENAME)
    const fileExists = await exists(filePath)
    if (!fileExists) return []
    const content = await readTextFile(filePath)
    const data = JSON.parse(content) as ProjectsFile
    return data.projects ?? []
  } catch {
    return []
  }
}

export async function writeProjects(
  workspacePath: string,
  projects: Project[]
): Promise<void> {
  try {
    const filePath = await join(workspacePath, PROJECTS_FILENAME)
    const data: ProjectsFile = { projects }
    await writeTextFile(filePath, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Failed to write projects:', e)
  }
}