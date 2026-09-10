import { defineStore } from 'pinia'

const STORAGE_KEY = 'poetryhub-write-projects-v1'
const DEFAULT_ID = 'project-default'

export interface WriteProject {
  id: string
  name: string
  title: string
  lyrics: string
  savedWords: string[]
  /** Linked `UserPoemDraft` id when saved to the account; null = local-only. */
  draftId: string | null
}

export type RemoteDraftSummary = {
  id: string
  title: string
  updatedAt?: string
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeProjectName(name: string): string {
  return name.trim() === 'Proiect nou' ? 'Proiect' : name
}

function ensureUniqueProjectIds(list: WriteProject[]): WriteProject[] {
  const seen = new Set<string>()
  const out: WriteProject[] = []
  for (const p of list) {
    let id = typeof p.id === 'string' && p.id.length > 0 ? p.id : newId()
    if (seen.has(id)) {
      id = newId()
      while (seen.has(id)) id = newId()
    }
    seen.add(id)
    out.push({ ...p, id })
  }
  return out
}

function normalizeProjectsList(list: WriteProject[]): WriteProject[] {
  const mapped = list.map((p) => ({
    ...p,
    name: normalizeProjectName(typeof p.name === 'string' ? p.name : 'Proiect'),
    title: typeof p.title === 'string' ? p.title : '',
    lyrics: typeof p.lyrics === 'string' ? p.lyrics : '',
    savedWords: Array.isArray(p.savedWords)
      ? p.savedWords.filter((x): x is string => typeof x === 'string')
      : [],
    draftId:
      typeof (p as WriteProject).draftId === 'string' && (p as WriteProject).draftId
        ? (p as WriteProject).draftId
        : null,
  }))
  return ensureUniqueProjectIds(mapped)
}

function defaultProject(): WriteProject {
  return {
    id: DEFAULT_ID,
    name: 'Proiect',
    title: '',
    lyrics: '',
    savedWords: [],
    draftId: null,
  }
}

function loadLocal(): { projects: WriteProject[]; currentProjectId: string | null } {
  if (!import.meta.client) {
    return { projects: [defaultProject()], currentProjectId: DEFAULT_ID }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as {
        projects?: WriteProject[]
        currentProjectId?: string | null
      }
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        const normalized = normalizeProjectsList(data.projects)
        const cid =
          data.currentProjectId && normalized.some((p) => p.id === data.currentProjectId)
            ? data.currentProjectId
            : normalized[0]!.id
        return { projects: normalized, currentProjectId: cid }
      }
    }
  } catch {
    /* ignore */
  }
  return { projects: [defaultProject()], currentProjectId: DEFAULT_ID }
}

export const useWriteProjectsStore = defineStore('writeProjects', () => {
  const projects = ref<WriteProject[]>([])
  const currentProjectId = ref<string | null>(null)
  const remoteSyncing = ref(false)

  const currentProject = computed(() =>
    projects.value.find((p) => p.id === currentProjectId.value) ?? null,
  )

  function saveLocal() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projects: projects.value,
          currentProjectId: currentProjectId.value,
        }),
      )
    } catch {
      /* ignore */
    }
  }

  function hydrateLocalOnly() {
    const { projects: p, currentProjectId: cid } = loadLocal()
    projects.value = p
    currentProjectId.value = cid
  }

  let initialized = false

  async function init() {
    if (!import.meta.client || initialized) return
    initialized = true
    hydrateLocalOnly()
    watch([projects, currentProjectId], () => saveLocal(), { deep: true })
  }

  /**
   * Merge account drafts into the dropdown so every saved draft appears.
   * Keeps unsaved local projects and preserves per-project savedWords.
   */
  async function syncRemoteDrafts(): Promise<void> {
    if (!import.meta.client) return
    remoteSyncing.value = true
    try {
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

      const fromRemote: WriteProject[] = remote.map((d) => {
        const existing = byDraftId.get(d.id)
        const title = (d.title || '').trim() || 'Proiect'
        if (existing) {
          return {
            ...existing,
            name: title,
            title: existing.title?.trim() ? existing.title : title,
            draftId: d.id,
          }
        }
        return {
          id: d.id,
          draftId: d.id,
          name: title,
          title,
          lyrics: '',
          savedWords: [],
        }
      })

      // Prefer remote list order (updatedAt desc from API); keep unsaved locals on top.
      const next = [...unsavedLocals, ...fromRemote]
      projects.value = next.length > 0 ? next : [defaultProject()]

      if (
        !currentProjectId.value
        || !projects.value.some((p) => p.id === currentProjectId.value)
      ) {
        currentProjectId.value = projects.value[0]!.id
      }
    } catch {
      /* not logged in / network — keep local list */
    } finally {
      remoteSyncing.value = false
    }
  }

  /** For toolbar „Salvează”: persistă explicit (datele se salvează și la fiecare modificare). */
  async function saveNow(): Promise<{ ok: boolean }> {
    saveLocal()
    return { ok: true }
  }

  function createProject(name: string) {
    const base = name.trim() || 'Proiect'
    const p: WriteProject = {
      id: newId(),
      draftId: null,
      name: base,
      title: base,
      lyrics: '',
      savedWords: [],
    }
    projects.value.unshift(p)
    currentProjectId.value = p.id
  }

  function deleteProject(id: string) {
    const idx = projects.value.findIndex((x) => x.id === id)
    if (idx === -1) return
    projects.value.splice(idx, 1)
    if (projects.value.length === 0) {
      createProject('Proiect')
      return
    }
    if (currentProjectId.value === id) {
      currentProjectId.value = projects.value[Math.max(0, idx - 1)]!.id
    }
  }

  function renameProject(id: string, name: string) {
    const p = projects.value.find((x) => x.id === id)
    if (p) p.name = name.trim() || p.name
  }

  function linkCurrentDraft(draftId: string) {
    const p = currentProject.value
    if (!p) return
    p.draftId = draftId
    // Prefer draft id as stable project id once synced.
    if (p.id !== draftId) {
      const oldId = p.id
      p.id = draftId
      if (currentProjectId.value === oldId) currentProjectId.value = draftId
    }
    p.name = (p.title || '').trim() || p.name || 'Proiect'
  }

  function setLyrics(text: string) {
    const p = currentProject.value
    if (!p) return
    p.lyrics = text
  }

  function setTitle(title: string) {
    const p = currentProject.value
    if (!p) return
    const next = title
    p.title = next
    const nextTitleTrim = (next || '').trim()
    // Rename UI was removed; keep the project label identical to the poem title.
    p.name = nextTitleTrim || 'Proiect'
  }

  function appendToLyrics(word: string) {
    const p = currentProject.value
    if (!p) return
    const sep = p.lyrics && !p.lyrics.endsWith('\n') ? ' ' : ''
    p.lyrics = `${p.lyrics}${sep}${word}`
  }

  function clearLyrics() {
    const p = currentProject.value
    if (!p) return
    p.lyrics = ''
  }

  function addSavedWord(word: string) {
    const p = currentProject.value
    if (!p) return
    const w = word.trim()
    if (!w) return
    const low = w.toLowerCase()
    if (p.savedWords.some((s) => s.toLowerCase() === low)) return
    p.savedWords.push(w)
  }

  function removeSavedWord(word: string) {
    const p = currentProject.value
    if (!p) return
    const low = word.toLowerCase()
    p.savedWords = p.savedWords.filter((s) => s.toLowerCase() !== low)
  }

  function isWordSaved(word: string): boolean {
    const p = currentProject.value
    if (!p) return false
    const low = word.trim().toLowerCase()
    return p.savedWords.some((s) => s.toLowerCase() === low)
  }

  if (!import.meta.client) {
    projects.value = [defaultProject()]
    currentProjectId.value = DEFAULT_ID
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    remoteSyncing,
    init,
    syncRemoteDrafts,
    createProject,
    deleteProject,
    renameProject,
    linkCurrentDraft,
    setTitle,
    setLyrics,
    appendToLyrics,
    clearLyrics,
    addSavedWord,
    removeSavedWord,
    isWordSaved,
    saveNow,
  }
})
