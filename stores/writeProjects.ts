import { defineStore } from 'pinia'

const STORAGE_KEY = 'poetryhub-write-projects-v1'
const DEFAULT_ID = 'project-default'

export interface WriteProject {
  id: string
  name: string
  lyrics: string
  savedWords: string[]
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
    lyrics: typeof p.lyrics === 'string' ? p.lyrics : '',
    savedWords: Array.isArray(p.savedWords)
      ? p.savedWords.filter((x): x is string => typeof x === 'string')
      : [],
  }))
  return ensureUniqueProjectIds(mapped)
}

function defaultProject(): WriteProject {
  return { id: DEFAULT_ID, name: 'Proiect', lyrics: '', savedWords: [] }
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

  /** For toolbar „Salvează”: persistă explicit (datele se salvează și la fiecare modificare). */
  async function saveNow(): Promise<{ ok: boolean }> {
    saveLocal()
    return { ok: true }
  }

  function createProject(name: string) {
    const p: WriteProject = {
      id: newId(),
      name: name.trim() || 'Proiect',
      lyrics: '',
      savedWords: [],
    }
    projects.value.push(p)
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

  function setLyrics(text: string) {
    const p = currentProject.value
    if (!p) return
    p.lyrics = text
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
    init,
    createProject,
    deleteProject,
    renameProject,
    setLyrics,
    appendToLyrics,
    clearLyrics,
    addSavedWord,
    removeSavedWord,
    isWordSaved,
    saveNow,
  }
})
