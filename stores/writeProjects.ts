import { defineStore } from 'pinia'

/** Remembers only which project/draft was active — not full project payloads. */
const ACTIVE_KEY = 'poetryhub-write-active-v1'
const FOLDER_COLLAPSE_KEY = 'poetryhub-write-folder-collapse-v1'
const PROJECT_ORDER_KEY = 'poetryhub-write-project-order-v1'

export interface WriteFolder {
  id: string
  name: string
}

export interface WriteProject {
  id: string
  name: string
  title: string
  lyrics: string
  savedWords: string[]
  /** Linked `UserPoemDraft` id when saved to the account; null = session-only. */
  draftId: string | null
  /** Optional write folder id. */
  folderId: string | null
}

export type RemoteDraftSummary = {
  id: string
  title: string
  folderId?: string | null
  updatedAt?: string
}

type ScratchBuffer = {
  title: string
  lyrics: string
  savedWords: string[]
}

type ActivePreference = {
  token: string
  name: string
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function blankSessionProject(name: string, folderId: string | null = null): WriteProject {
  const base = name.trim() || 'Proiect'
  return {
    id: newId(),
    name: base,
    title: '',
    lyrics: '',
    savedWords: [],
    draftId: null,
    folderId,
  }
}

function emptyScratch(): ScratchBuffer {
  return { title: '', lyrics: '', savedWords: [] }
}

function readActivePreference(): ActivePreference | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw || !raw.trim()) return null
    const trimmed = raw.trim()
    if (trimmed === 'project-default') return null
    // Legacy: plain token string
    if (!trimmed.startsWith('{')) {
      return { token: trimmed, name: '' }
    }
    const parsed = JSON.parse(trimmed) as { token?: unknown; name?: unknown }
    const token = typeof parsed.token === 'string' ? parsed.token.trim() : ''
    if (!token || token === 'project-default') return null
    const name = typeof parsed.name === 'string' ? parsed.name.trim() : ''
    return { token, name }
  } catch {
    return null
  }
}

function writeActivePreference(token: string, name: string) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ token, name }))
  } catch {
    /* ignore */
  }
}

function clearActivePreferenceStorage() {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}

function readCollapsedFolders(): Set<string> {
  if (!import.meta.client) return new Set()
  try {
    const raw = localStorage.getItem(FOLDER_COLLAPSE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function writeCollapsedFolders(ids: Set<string>) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(FOLDER_COLLAPSE_KEY, JSON.stringify([...ids]))
  } catch {
    /* ignore */
  }
}

function projectOrderStorageKey(userId?: string | null): string {
  return userId ? `${PROJECT_ORDER_KEY}:${userId}` : PROJECT_ORDER_KEY
}

function readProjectOrder(userId?: string | null): string[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(projectOrderStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

function writeProjectOrder(order: string[], userId?: string | null) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(projectOrderStorageKey(userId), JSON.stringify(order))
  } catch {
    /* ignore */
  }
}

function projectToken(p: Pick<WriteProject, 'id' | 'draftId'>): string {
  return p.draftId || p.id
}

export const useWriteProjectsStore = defineStore('writeProjects', () => {
  /** Listed projects: only user-created or remotely saved drafts. */
  const projects = ref<WriteProject[]>([])
  const folders = ref<WriteFolder[]>([])
  const collapsedFolderIds = ref<Set<string>>(readCollapsedFolders())
  const projectOrder = ref<string[]>([])
  const currentProjectId = ref<string | null>(null)
  const remoteSyncing = ref(false)
  /** Editor buffer when no listed project is selected. Never shown in the dropdown. */
  const scratch = reactive<ScratchBuffer>(emptyScratch())
  /**
   * Last known active project label/token from localStorage.
   * Used so the toolbar shows the working project immediately on refresh
   * before remote drafts finish loading.
   */
  const lastActiveToken = ref<string | null>(null)
  const lastActiveName = ref<string | null>(null)

  // Client: restore label immediately so refresh does not flash "Fără proiect".
  if (import.meta.client) {
    const pref = readActivePreference()
    if (pref) {
      lastActiveToken.value = pref.token
      if (pref.name) lastActiveName.value = pref.name
    }
  }

  const currentProject = computed(() =>
    projects.value.find((p) => p.id === currentProjectId.value) ?? null,
  )

  const displayProjectName = computed(() =>
    currentProject.value?.name
    || lastActiveName.value
    || null,
  )

  function authUserId(): string | null {
    try {
      return useAuth().user.value?.id ?? null
    } catch {
      return null
    }
  }

  function loadProjectOrder() {
    projectOrder.value = readProjectOrder(authUserId())
  }

  function persistProjectOrder() {
    writeProjectOrder(projectOrder.value, authUserId())
  }

  function applyProjectOrder(list: WriteProject[]): WriteProject[] {
    if (!list.length) return list
    const order = projectOrder.value
    if (!order.length) return list
    const rank = new Map(order.map((id, i) => [id, i]))
    return [...list].sort((a, b) => {
      const ta = projectToken(a)
      const tb = projectToken(b)
      const ra = rank.has(ta) ? rank.get(ta)! : Number.MAX_SAFE_INTEGER
      const rb = rank.has(tb) ? rank.get(tb)! : Number.MAX_SAFE_INTEGER
      if (ra !== rb) return ra - rb
      return 0
    })
  }

  function syncOrderWithProjects() {
    const tokens = projects.value.map(projectToken)
    if (!tokens.length) {
      projectOrder.value = []
      persistProjectOrder()
      return
    }
    const seen = new Set<string>()
    const next: string[] = []
    for (const t of projectOrder.value) {
      if (!tokens.includes(t) || seen.has(t)) continue
      seen.add(t)
      next.push(t)
    }
    for (const t of tokens) {
      if (seen.has(t)) continue
      seen.add(t)
      next.push(t)
    }
    projectOrder.value = next
    persistProjectOrder()
  }

  /** Place `draggedId` before/after `targetId` in the project list order. */
  function reorderProject(
    draggedId: string,
    targetId: string,
    place: 'before' | 'after',
  ) {
    if (draggedId === targetId) return
    const dragged = projects.value.find((p) => p.id === draggedId)
    const target = projects.value.find((p) => p.id === targetId)
    if (!dragged || !target) return

    syncOrderWithProjects()
    const dragToken = projectToken(dragged)
    const targetToken = projectToken(target)
    const order = projectOrder.value.filter((t) => t !== dragToken)
    const ti = order.indexOf(targetToken)
    if (ti < 0) order.push(dragToken)
    else order.splice(place === 'before' ? ti : ti + 1, 0, dragToken)
    projectOrder.value = order
    persistProjectOrder()
    projects.value = applyProjectOrder(projects.value)
  }

  function rememberProjectAtFront(p: WriteProject) {
    const token = projectToken(p)
    projectOrder.value = [token, ...projectOrder.value.filter((t) => t !== token)]
    persistProjectOrder()
    projects.value = applyProjectOrder(projects.value)
  }

  function clearScratch() {
    scratch.title = ''
    scratch.lyrics = ''
    scratch.savedWords = []
  }

  function clearActivePreference() {
    lastActiveToken.value = null
    lastActiveName.value = null
    clearActivePreferenceStorage()
  }

  function rememberActiveProject() {
    const p = currentProject.value
    // Do not wipe persistence while bootstrapping (current is briefly null).
    if (!p) return
    const token = p.draftId || p.id
    lastActiveToken.value = token
    lastActiveName.value = p.name
    writeActivePreference(token, p.name)
  }

  function findProjectByToken(token: string | null | undefined): WriteProject | null {
    if (!token) return null
    return (
      projects.value.find((p) => p.draftId === token || p.id === token) ?? null
    )
  }

  function hydrateActivePreferenceFromStorage() {
    const pref = readActivePreference()
    if (!pref) return
    lastActiveToken.value = pref.token
    if (pref.name) lastActiveName.value = pref.name
  }

  /** Select a remembered / preferred project if it still exists in the list. */
  function restoreActivePreference(preferredToken?: string | null): boolean {
    const fromArg = preferredToken?.trim() || ''
    const token = fromArg || lastActiveToken.value || readActivePreference()?.token || null
    const match = findProjectByToken(token)
    if (!match) return false
    currentProjectId.value = match.id
    clearScratch()
    rememberActiveProject()
    return true
  }

  let initialized = false
  let stopActiveWatch: (() => void) | null = null

  /** Idempotent client ready hook. */
  async function init() {
    if (!import.meta.client || initialized) return
    initialized = true
    // Drop legacy full-project local cache from older builds.
    try {
      localStorage.removeItem('poetryhub-write-projects-v1')
    } catch {
      /* ignore */
    }
    hydrateActivePreferenceFromStorage()
    collapsedFolderIds.value = readCollapsedFolders()
    loadProjectOrder()
    stopActiveWatch?.()
    stopActiveWatch = watch(
      currentProjectId,
      () => {
        rememberActiveProject()
      },
      { flush: 'post' },
    )
  }

  /**
   * Promote the scratch buffer into a listed project (save / first draft link).
   * No-op when a project is already selected.
   */
  function ensureListedProject(fallbackName = 'Proiect'): WriteProject {
    const existing = currentProject.value
    if (existing) return existing

    const titleTrim = scratch.title.trim()
    const name = titleTrim || fallbackName.trim() || 'Proiect'
    const p = blankSessionProject(name)
    p.title = scratch.title
    p.name = name
    p.lyrics = scratch.lyrics
    p.savedWords = [...scratch.savedWords]
    clearScratch()
    projects.value.unshift(p)
    currentProjectId.value = p.id
    rememberProjectAtFront(p)
    rememberActiveProject()
    return p
  }

  function selectFirstAvailableProject() {
    const first = projects.value[0]
    if (!first) {
      currentProjectId.value = null
      return false
    }
    currentProjectId.value = first.id
    clearScratch()
    rememberActiveProject()
    return true
  }

  async function syncFolders(): Promise<void> {
    if (!import.meta.client) return
    try {
      const res = await $fetch<{ data: WriteFolder[] }>('/api/user/write-folders', {
        credentials: 'include',
      })
      folders.value = Array.isArray(res.data) ? res.data : []
    } catch {
      /* not logged in / network */
    }
  }

  /**
   * Merge account drafts into the dropdown so every saved draft appears.
   * Keeps unsaved session projects the user explicitly created; never invents a default.
   */
  async function syncRemoteDrafts(preferredToken?: string | null): Promise<void> {
    if (!import.meta.client) return
    await init()
    remoteSyncing.value = true
    try {
      await syncFolders()
      const res = await $fetch<{ data: RemoteDraftSummary[] }>('/api/user/drafts', {
        credentials: 'include',
        params: { page: 1, limit: 50 },
      })
      const remote = Array.isArray(res.data) ? res.data : []
      const byDraftId = new Map(
        projects.value
          .filter((p) => p.draftId)
          .map((p) => [p.draftId as string, p] as const),
      )
      const unsavedLocals = projects.value.filter((p) => !p.draftId)
      const folderIds = new Set(folders.value.map((f) => f.id))

      const fromRemote: WriteProject[] = remote.map((d) => {
        const existing = byDraftId.get(d.id)
        const title = (d.title || '').trim() || 'Proiect'
        const folderId =
          typeof d.folderId === 'string' && folderIds.has(d.folderId) ? d.folderId : null
        if (existing) {
          return {
            ...existing,
            name: title,
            title: existing.title?.trim() ? existing.title : title,
            draftId: d.id,
            folderId,
          }
        }
        return {
          id: d.id,
          draftId: d.id,
          name: title,
          title,
          lyrics: '',
          savedWords: [],
          folderId,
        }
      })

      // Keep unsaved locals, then remotes; user drag-order is reapplied below.
      loadProjectOrder()
      projects.value = applyProjectOrder([...unsavedLocals, ...fromRemote])
      syncOrderWithProjects()

      if (!restoreActivePreference(preferredToken)) {
        if (projects.value.length === 0) {
          currentProjectId.value = null
          // Keep lastActive* so a transient empty sync does not blank the toolbar;
          // only clear when we know there is nothing to restore.
          if (!lastActiveToken.value) clearActivePreference()
        } else if (
          !currentProjectId.value
          || !projects.value.some((p) => p.id === currentProjectId.value)
        ) {
          selectFirstAvailableProject()
        }
      }
    } catch {
      /* not logged in / network — keep in-memory list */
    } finally {
      remoteSyncing.value = false
    }
  }

  async function saveNow(): Promise<{ ok: boolean }> {
    return { ok: true }
  }

  function createProject(name: string, folderId: string | null = null) {
    const label = name.trim() || 'Proiect'
    const resolvedFolder =
      folderId && folders.value.some((f) => f.id === folderId) ? folderId : null
    const p = blankSessionProject(label, resolvedFolder)
    // Adopt scratch when creating from an unlisted editor session.
    if (!currentProject.value) {
      p.lyrics = scratch.lyrics
      p.savedWords = [...scratch.savedWords]
      const titleTrim = scratch.title.trim()
      p.title = titleTrim || label
      p.name = titleTrim || label
      clearScratch()
    } else {
      p.title = label
    }
    projects.value.unshift(p)
    currentProjectId.value = p.id
    rememberProjectAtFront(p)
    rememberActiveProject()
  }

  async function createFolder(name: string): Promise<WriteFolder | null> {
    const label = name.trim()
    if (!label) return null
    try {
      const created = await $fetch<WriteFolder>('/api/user/write-folders', {
        method: 'POST',
        credentials: 'include',
        body: { name: label },
      })
      folders.value = [...folders.value, created].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
      return created
    } catch {
      return null
    }
  }

  async function renameFolder(id: string, name: string): Promise<void> {
    const label = name.trim()
    if (!label) return
    const folder = folders.value.find((f) => f.id === id)
    if (!folder) return
    const prev = folder.name
    folder.name = label
    folders.value = [...folders.value].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    )
    try {
      await $fetch(`/api/user/write-folders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { name: label },
      })
    } catch {
      folder.name = prev
      folders.value = [...folders.value].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
    }
  }

  async function deleteFolder(id: string): Promise<void> {
    const idx = folders.value.findIndex((f) => f.id === id)
    if (idx < 0) return
    const removed = folders.value[idx]!
    folders.value.splice(idx, 1)
    for (const p of projects.value) {
      if (p.folderId === id) p.folderId = null
    }
    collapsedFolderIds.value.delete(id)
    writeCollapsedFolders(collapsedFolderIds.value)
    try {
      await $fetch(`/api/user/write-folders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
      folders.value.splice(idx, 0, removed)
      folders.value = [...folders.value].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
    }
  }

  async function setProjectFolder(projectId: string, folderId: string | null) {
    const p = projects.value.find((x) => x.id === projectId)
    if (!p) return
    const next =
      folderId && folders.value.some((f) => f.id === folderId) ? folderId : null
    const prev = p.folderId
    p.folderId = next
    if (!p.draftId) return
    try {
      // Minimal update: reuse PUT body is heavy — dedicated field via PUT with current
      // content would require a fetch. Send folderId-only through a light PATCH on draft.
      await $fetch(`/api/user/drafts/${encodeURIComponent(p.draftId)}/folder`, {
        method: 'PATCH',
        credentials: 'include',
        body: { folderId: next },
      })
    } catch {
      p.folderId = prev
    }
  }

  function toggleFolderCollapsed(id: string) {
    const next = new Set(collapsedFolderIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    collapsedFolderIds.value = next
    writeCollapsedFolders(next)
  }

  function isFolderCollapsed(id: string): boolean {
    return collapsedFolderIds.value.has(id)
  }

  function selectProject(id: string) {
    if (!projects.value.some((p) => p.id === id)) return
    currentProjectId.value = id
    clearScratch()
    rememberActiveProject()
  }

  function deleteProject(id: string) {
    const idx = projects.value.findIndex((x) => x.id === id)
    if (idx === -1) return
    const removed = projects.value[idx]!
    projects.value.splice(idx, 1)
    projectOrder.value = projectOrder.value.filter((t) => t !== projectToken(removed))
    persistProjectOrder()
    if (projects.value.length === 0) {
      currentProjectId.value = null
      clearScratch()
      clearActivePreference()
      return
    }
    if (currentProjectId.value === id || !projects.value.some((p) => p.id === currentProjectId.value)) {
      currentProjectId.value = projects.value[Math.max(0, Math.min(idx, projects.value.length - 1))]!.id
      clearScratch()
    }
    rememberActiveProject()
  }

  function renameProject(id: string, name: string) {
    const p = projects.value.find((x) => x.id === id)
    if (p) p.name = name.trim() || p.name
  }

  function linkCurrentDraft(draftId: string) {
    const p = ensureListedProject()
    const prevToken = projectToken(p)
    p.draftId = draftId
    // Prefer draft id as stable project id once synced.
    if (p.id !== draftId) {
      const oldId = p.id
      p.id = draftId
      if (currentProjectId.value === oldId) currentProjectId.value = draftId
    }
    const nextToken = projectToken(p)
    if (prevToken !== nextToken) {
      projectOrder.value = projectOrder.value.map((t) => (t === prevToken ? nextToken : t))
      if (!projectOrder.value.includes(nextToken)) {
        projectOrder.value = [nextToken, ...projectOrder.value]
      }
      persistProjectOrder()
    }
    p.name = (p.title || '').trim() || p.name || 'Proiect'
    rememberActiveProject()
  }

  function setLyrics(text: string) {
    const p = currentProject.value
    if (p) p.lyrics = text
    else scratch.lyrics = text
  }

  function setTitle(title: string) {
    const next = title
    const p = currentProject.value
    if (p) {
      p.title = next
      const nextTitleTrim = (next || '').trim()
      p.name = nextTitleTrim || p.name || 'Proiect'
      rememberActiveProject()
    } else {
      scratch.title = next
    }
  }

  function appendToLyrics(word: string) {
    const p = currentProject.value
    if (p) {
      const sep = p.lyrics && !p.lyrics.endsWith('\n') ? ' ' : ''
      p.lyrics = `${p.lyrics}${sep}${word}`
      return
    }
    const sep = scratch.lyrics && !scratch.lyrics.endsWith('\n') ? ' ' : ''
    scratch.lyrics = `${scratch.lyrics}${sep}${word}`
  }

  function clearLyrics() {
    const p = currentProject.value
    if (p) p.lyrics = ''
    else scratch.lyrics = ''
  }

  function addSavedWord(word: string) {
    const w = word.trim()
    if (!w) return
    const low = w.toLowerCase()
    const list = currentProject.value?.savedWords ?? scratch.savedWords
    if (list.some((s) => s.toLowerCase() === low)) return
    list.push(w)
  }

  function removeSavedWord(word: string) {
    const low = word.toLowerCase()
    const p = currentProject.value
    if (p) {
      p.savedWords = p.savedWords.filter((s) => s.toLowerCase() !== low)
      return
    }
    scratch.savedWords = scratch.savedWords.filter((s) => s.toLowerCase() !== low)
  }

  function setSavedWords(words: string[]) {
    const cleaned: string[] = []
    const seen = new Set<string>()
    for (const raw of words) {
      const w = (raw || '').trim()
      if (!w) continue
      const low = w.toLowerCase()
      if (seen.has(low)) continue
      seen.add(low)
      cleaned.push(w)
    }
    const p = currentProject.value
    if (p) p.savedWords = cleaned
    else scratch.savedWords = cleaned
  }

  function isWordSaved(word: string): boolean {
    const low = word.trim().toLowerCase()
    const list = currentProject.value?.savedWords ?? scratch.savedWords
    return list.some((s) => s.toLowerCase() === low)
  }

  const activeSavedWords = computed(() =>
    currentProject.value?.savedWords ?? scratch.savedWords,
  )

  /** Title/lyrics for the editor — listed project or unlisted scratch. */
  const editorTitle = computed(() => currentProject.value?.title ?? scratch.title)
  const editorLyrics = computed(() => currentProject.value?.lyrics ?? scratch.lyrics)

  return {
    projects,
    folders,
    currentProjectId,
    currentProject,
    remoteSyncing,
    activeSavedWords,
    editorTitle,
    editorLyrics,
    lastActiveToken,
    lastActiveName,
    displayProjectName,
    init,
    syncRemoteDrafts,
    syncFolders,
    restoreActivePreference,
    ensureListedProject,
    createProject,
    createFolder,
    renameFolder,
    deleteFolder,
    setProjectFolder,
    reorderProject,
    toggleFolderCollapsed,
    isFolderCollapsed,
    selectProject,
    deleteProject,
    renameProject,
    linkCurrentDraft,
    setTitle,
    setLyrics,
    appendToLyrics,
    clearLyrics,
    addSavedWord,
    removeSavedWord,
    setSavedWords,
    isWordSaved,
    saveNow,
    clearActivePreference,
  }
})
