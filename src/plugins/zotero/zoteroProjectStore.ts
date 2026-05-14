import { create } from 'zustand'
import { Project, PageLink, readProjects, writeProjects } from './zoteroProjects'
import { getSettings } from '../../store/settingsStore'
import { useLangStore } from '../../store/langStore'

export function getDefaultRoles(): string[] {
  const t = useLangStore.getState().t
  return [
    t.zoteroRoleTheory,
    t.zoteroRoleMethod,
    t.zoteroRoleData,
    t.zoteroRoleResult,
    t.zoteroRoleBackground,
    t.zoteroRoleCritique,
  ]
}

interface ZoteroProjectStore {
  // 狀態
  projects: Project[]
  customRoles: string[]
  isLoaded: boolean

  // 操作
  loadProjects: () => Promise<void>
  addProject: (name: string, noteId: string) => Promise<void>
  removeProject: (projectId: string) => Promise<void>
  renameProject: (projectId: string, name: string) => Promise<void>

  addPageLink: (projectId: string, link: PageLink) => Promise<void>
  removePageLink: (projectId: string, docId: string, pageId: string) => Promise<void>
  updatePageLink: (
    projectId: string,
    docId: string,
    pageId: string,
    updates: Partial<Pick<PageLink, 'role' | 'note'>>
  ) => Promise<void>

  addCustomRole: (role: string) => void
  removeCustomRole: (role: string) => void

  // 查詢
  getLinksForPage: (docId: string, pageId: string) => { project: Project; link: PageLink }[]
}

export const useZoteroProjectStore = create<ZoteroProjectStore>()((set, get) => ({
  projects: [],
  customRoles: [],
  isLoaded: false,

  loadProjects: async () => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = await readProjects(workspacePath)
    set({ projects, isLoaded: true })
  },

  addProject: async (name, noteId) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      noteId,
      createdAt: new Date().toISOString(),
      pageLinks: [],
    }
    const projects = [...get().projects, newProject]
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  removeProject: async (projectId) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = get().projects.filter(p => p.id !== projectId)
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  renameProject: async (projectId, name) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = get().projects.map(p =>
      p.id === projectId ? { ...p, name } : p
    )
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  addPageLink: async (projectId, link) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      // 同一頁同一專案只能有一條連結，避免重複
      const exists = p.pageLinks.find(
        l => l.docId === link.docId && l.pageId === link.pageId
      )
      if (exists) return p
      return { ...p, pageLinks: [...p.pageLinks, link] }
    })
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  removePageLink: async (projectId, docId, pageId) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        pageLinks: p.pageLinks.filter(
          l => !(l.docId === docId && l.pageId === pageId)
        ),
      }
    })
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  updatePageLink: async (projectId, docId, pageId, updates) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        pageLinks: p.pageLinks.map(l =>
          l.docId === docId && l.pageId === pageId
            ? { ...l, ...updates }
            : l
        ),
      }
    })
    set({ projects })
    await writeProjects(workspacePath, projects)
  },

  addCustomRole: (role) => set(state => ({
    customRoles: state.customRoles.includes(role)
      ? state.customRoles
      : [...state.customRoles, role],
  })),

  removeCustomRole: (role) => set(state => ({
    customRoles: state.customRoles.filter(r => r !== role),
  })),

  getLinksForPage: (docId, pageId) => {
    return get().projects.flatMap(project => {
      const link = project.pageLinks.find(
        l => l.docId === docId && l.pageId === pageId
      )
      return link ? [{ project, link }] : []
    })
  },
}))
