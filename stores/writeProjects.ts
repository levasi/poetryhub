import { defineStore } from 'pinia'

/** Remembers only which project/draft was active — not full project payloads. */
const ACTIVE_KEY = 'poetryhub-write-active-v1'

export interface WriteProject {
  id: string
  name: string
  title: string
  lyrics: string
  savedWords: string[]
  /** Linked `UserPoemDraft` id when saved to the account; null = session-only. */
  draftId: string | null
}

export type RemoteDraftSummary = {
  id: string
  title: string
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

function blankSessionProject(name: string): WriteProject {
  const base = name.trim() || 'Proiect'
  return {
    id: newId(),
    name: base,
    title: '',
    lyrics: '',
    savedWords: [],
    draftId: null,
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

export const useWriteProjectsStore = defineStore('writeProjects', () => {
  /** Listed projects: only user-created or remotely saved drafts. */
  const projects = ref<WriteProject[]>([])
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

  /**
   * Merge account drafts into the dropdown so every saved draft appears.
   * Keeps unsaved session projects the user explicitly created; never invents a default.
   */
  async function syncRemoteDrafts(preferredToken?: string | null): Promise<void> {
    if (!import.meta.client) return
    await init()
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

      // Prefer remote list order (updatedAt desc from API); keep real unsaved locals on top.
      projects.value = [...unsavedLocals, ...fromRemote]

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

  function createProject(name: string) {
    const label = name.trim() || 'Proiect'
    const p = blankSessionProject(label)
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
    rememberActiveProject()
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
    projects.value.splice(idx, 1)
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
    p.draftId = draftId
    // Prefer draft id as stable project id once synced.
    if (p.id !== draftId) {
      const oldId = p.id
      p.id = draftId
      if (currentProjectId.value === oldId) currentProjectId.value = draftId
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
    restoreActivePreference,
    ensureListedProject,
    createProject,
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
