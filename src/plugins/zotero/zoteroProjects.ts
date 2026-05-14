import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

const PROJECTS_FILENAME = '.zotero-projects.json'

export interface PageLink {
  docId: string   // 文件的檔案路徑（savePath），作為唯一識別
  pageId: string
  role: string
  note?: string
}

export interface Project {
  id: string
  name: string
  noteId: string
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
    console.error('Failed to write zotero projects:', e)
  }
}

export async function addPageLink(
  workspacePath: string,
  projectId: string,
  link: PageLink
): Promise<void> {
  const projects = await readProjects(workspacePath)
  const project = projects.find(p => p.id === projectId)
  if (!project) return
  project.pageLinks.push(link)
  await writeProjects(workspacePath, projects)
}

export async function removePageLink(
  workspacePath: string,
  projectId: string,
  docId: string,
  pageId: string
): Promise<void> {
  const projects = await readProjects(workspacePath)
  const project = projects.find(p => p.id === projectId)
  if (!project) return
  project.pageLinks = project.pageLinks.filter(
    l => !(l.docId === docId && l.pageId === pageId)
  )
  await writeProjects(workspacePath, projects)
}

export async function updatePageLink(
  workspacePath: string,
  projectId: string,
  docId: string,
  pageId: string,
  updates: Partial<Pick<PageLink, 'role' | 'note'>>
): Promise<void> {
  const projects = await readProjects(workspacePath)
  const project = projects.find(p => p.id === projectId)
  if (!project) return
  const link = project.pageLinks.find(
    l => l.docId === docId && l.pageId === pageId
  )
  if (!link) return
  Object.assign(link, updates)
  await writeProjects(workspacePath, projects)
}