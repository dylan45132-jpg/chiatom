import { create } from 'zustand'
import { Project, PageLink, readProjects, writeProjects } from './projects'
import { getSettings } from './settingsStore'

const CUSTOM_ROLES_KEY = 'project.customRoles'

async function loadCustomRolesFromStore(): Promise<string[]> {
  try {
    const { load } = await import('@tauri-apps/plugin-store')
    const store = await load('settings.json')
    const val = await store.get<string[]>(CUSTOM_ROLES_KEY)
    return val ?? []
  } catch {
    return []
  }
}

async function saveCustomRolesToStore(roles: string[]): Promise<void> {
  try {
    const { load } = await import('@tauri-apps/plugin-store')
    const store = await load('settings.json')
    await store.set(CUSTOM_ROLES_KEY, roles)
    await store.save()
  } catch (e) {
    console.error('Failed to save customRoles:', e)
  }
}

interface ProjectStore {
  projects: Project[]
  customRoles: string[]
  isLoaded: boolean

  loadProjects: () => Promise<void>
  addProject: (name: string) => Promise<void>
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

  addCustomRole: (role: string) => Promise<void>
  removeCustomRole: (role: string) => Promise<void>

  getLinksForPage: (docId: string, pageId: string) => { project: Project; link: PageLink }[]
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],
  customRoles: [],
  isLoaded: false,

  loadProjects: async () => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const [projects, customRoles] = await Promise.all([
      readProjects(workspacePath),
      loadCustomRolesFromStore(),
    ])
    set({ projects, customRoles, isLoaded: true })
  },

  addProject: async (name) => {
    const workspacePath = getSettings().workspacePath
    if (!workspacePath) return
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
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

  addCustomRole: async (role) => {
    const current = get().customRoles
    if (current.includes(role)) return
    const next = [...current, role]
    set({ customRoles: next })
    await saveCustomRolesToStore(next)
  },

  removeCustomRole: async (role) => {
    const next = get().customRoles.filter(r => r !== role)
    set({ customRoles: next })
    await saveCustomRolesToStore(next)
  },

  getLinksForPage: (docId, pageId) => {
    return get().projects.flatMap(project => {
      const link = project.pageLinks.find(
        l => l.docId === docId && l.pageId === pageId
      )
      return link ? [{ project, link }] : []
    })
  },
}))