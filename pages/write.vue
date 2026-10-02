<script setup lang="ts">
import type { SearchMode } from '~/lib/rhyme/wordQueries'
import { Icon } from '@iconify/vue'
import WriteLyricsEditor from '~/components/write/LyricsEditor.vue'
import WriteSearchActions from '~/components/write/WriteSearchActions.vue'
import { getFetchErrorStatus } from '~/utils/fetchApiError'
import { searchableTerms as pickSearchableTerms } from '~/utils/writeSearch'
import { toPublishablePoemContent } from '~/utils/writeVerseBlocks'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useHead({
  title: () => t('write.seoTitle'),
  meta: [{ name: 'description', content: () => t('write.seoDesc') }],
})

const lyrics = useWriteLyricsStore()
const projects = useWriteProjectsStore()

/** Hide the editor until the active project/draft is restored — avoids empty→populated flash. */
const workspaceReady = ref(false)
const writeBootLoading = useState('write-boot-loading', () => false)

// Show the shared page loader as soon as this route is entered (SSR + client).
writeBootLoading.value = true

// —— Căutare dicționar
const modes: { id: SearchMode; label: string; hint: string }[] = [
  { id: 'fuzzy', label: 'Potrivire', hint: 'Căutare fuzzy în dicționar' },
  { id: 'starts', label: 'Începe cu', hint: 'Prefix' },
  { id: 'ends', label: 'Se termină cu', hint: 'Sufix' },
  { id: 'contains', label: 'Conține', hint: 'Subșir în cuvânt' },
  { id: 'anagram', label: 'Anagramă', hint: 'Aceleași litere' },
  { id: 'exact', label: 'Exact', hint: 'Formă exactă' },
  { id: 'synonyms', label: 'Sinonime', hint: 'Sinonime pentru cuvânt' },
  { id: 'antonyms', label: 'Antonime', hint: 'Antonime pentru cuvânt' },
]

const mode = ref<SearchMode>('contains')
const loading = ref(false)

/** Always treat diacritics as distinct in dictionary search (strict matching). */
const STRICT_DIACRITICS = true

const SEARCH_STATE_KEY = 'poetryhub-write-search-v1'
const SEARCH_MODES = new Set<SearchMode>([
  'fuzzy',
  'starts',
  'ends',
  'contains',
  'anagram',
  'exact',
  'synonyms',
  'antonyms',
])

let nextSearchQueryId = 0
interface SearchQueryRow {
  id: number
  text: string
}

/** Unul sau mai multe câmpuri de căutare; rezultatele se unesc (fără duplicate). */
const searchQueries = ref<SearchQueryRow[]>([{ id: ++nextSearchQueryId, text: '' }])

function persistSearchState() {
  if (!import.meta.client) return
  try {
    const texts = searchQueries.value.map((r) => r.text)
    localStorage.setItem(
      SEARCH_STATE_KEY,
      JSON.stringify({ mode: mode.value, queries: texts }),
    )
  } catch {
    /* ignore */
  }
}

function restoreSearchState(): boolean {
  if (!import.meta.client) return false
  try {
    const raw = localStorage.getItem(SEARCH_STATE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as { mode?: string; queries?: unknown }
    if (typeof data.mode === 'string' && SEARCH_MODES.has(data.mode as SearchMode)) {
      mode.value = data.mode as SearchMode
    }
    if (Array.isArray(data.queries)) {
      const texts = data.queries
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q)
      if (texts.length > 0) {
        searchQueries.value = texts.map((text) => ({
          id: ++nextSearchQueryId,
          text,
        }))
        return texts.some((t) => t.trim().length >= 2)
      }
    }
  } catch {
    /* ignore */
  }
  return false
}

watch([mode, searchQueries], () => persistSearchState(), { deep: true })

const activeSearchIndex = ref(0)
const searchInputEls = ref<(HTMLInputElement | null)[]>([])

function setSearchInputRef(index: number, el: unknown) {
  searchInputEls.value[index] = el instanceof HTMLInputElement ? el : null
}

function insertDiacritic(char: string) {
  const index = activeSearchIndex.value
  const row = searchQueries.value[index]
  if (!row) return

  const el = searchInputEls.value[index]
  const start = el?.selectionStart ?? row.text.length
  const end = el?.selectionEnd ?? row.text.length
  row.text = row.text.slice(0, start) + char + row.text.slice(end)

  nextTick(() => {
    const input = searchInputEls.value[index]
    if (!input) return
    input.focus()
    const pos = start + char.length
    input.setSelectionRange(pos, pos)
  })
}

function nonEmptySearchTerms(): string[] {
  return searchQueries.value.map((r) => r.text.trim()).filter(Boolean)
}

/** Terms with at least 2 letters — avoids noisy single-letter lookups. */
function searchableTerms(): string[] {
  return pickSearchableTerms(searchQueries.value)
}

const canSearch = computed(() => searchableTerms().length > 0)

function addSearchQuery() {
  searchQueries.value.push({ id: ++nextSearchQueryId, text: '' })
  nextTick(() => {
    const idx = searchQueries.value.length - 1
    activeSearchIndex.value = idx
    searchInputEls.value[idx]?.focus()
  })
}

function removeSearchQuery(index: number) {
  if (searchQueries.value.length <= 1) {
    searchQueries.value[0]!.text = ''
    return
  }
  searchQueries.value.splice(index, 1)
}

/** Bumped on each new search so stale in-flight responses cannot overwrite newer results. */
let searchGeneration = 0

interface Hit {
  id: string
  word: string
  type: string
  syllables: string
  syllableCount: number
  definition: string | null
  synonyms: string[]
}

const results = ref<Hit[]>([])
const resultsHasMore = ref(false)
const loadingMore = ref(false)

const RESULTS_PAGE_SIZE = 200

interface WordsSearchResponse {
  results: Hit[]
  total: number
  hasMore: boolean
  offset: number
  limit: number
}

function buildWordsQuery(terms: string[], offset: number): Record<string, string | number | string[]> {
  const queryParams: Record<string, string | number | string[]> = {
    q: terms.length === 1 ? terms[0]! : terms,
    mode: mode.value,
    limit: RESULTS_PAGE_SIZE,
    offset,
    strictDiacritics: STRICT_DIACRITICS ? 1 : 0,
  }
  if (mode.value === 'contains') {
    queryParams.useSyllablesInSearch = 0
  }
  return queryParams
}

async function fetchWordsPage(
  terms: string[],
  offset: number,
  gen: number,
): Promise<WordsSearchResponse | null> {
  const res = await $fetch<WordsSearchResponse>('/api/words', {
    query: buildWordsQuery(terms, offset),
  })
  if (gen !== searchGeneration) return null
  return res
}

const placeholder = computed(() => {
  switch (mode.value) {
    case 'starts':
      return 'Ex: iub, stră, cuv…'
    case 'ends':
      return 'Ex: re, ție, ture…'
    case 'contains':
      return 'Ex: ban, oar…'
    case 'anagram':
      return 'Literele unui cuvânt (ex: listen → silent)'
    case 'exact':
      return 'Cuvântul exact'
    case 'synonyms':
      return 'Cuvântul pentru care vrei sinonime'
    case 'antonyms':
      return 'Cuvântul pentru care vrei antonime'
    default:
      return 'Scrie un cuvânt sau o parte din el…'
  }
})

function selectSearchMode(id: SearchMode) {
  mode.value = id
  void runSearch()
}

async function runSearch() {
  const terms = searchableTerms()
  if (terms.length === 0) {
    searchGeneration++
    results.value = []
    resultsHasMore.value = false
    loading.value = false
    return
  }

  const gen = ++searchGeneration
  loading.value = true
  try {
    const res = await fetchWordsPage(terms, 0, gen)
    if (!res) return
    results.value = res.results
    resultsHasMore.value = res.hasMore
  } finally {
    if (gen === searchGeneration) loading.value = false
  }
}

async function loadMoreResults() {
  if (loadingMore.value || loading.value || !resultsHasMore.value) return
  const terms = searchableTerms()
  if (!terms.length) return

  const gen = searchGeneration
  loadingMore.value = true
  try {
    const res = await fetchWordsPage(terms, results.value.length, gen)
    if (!res) return
    const seen = new Set(results.value.map((r) => r.id))
    for (const h of res.results) {
      if (!seen.has(h.id)) {
        seen.add(h.id)
        results.value.push(h)
      }
    }
    resultsHasMore.value = res.hasMore
  } finally {
    if (gen === searchGeneration) loadingMore.value = false
  }
}

function pickWord(w: string) {
  lyrics.appendToActive(w)
}

function saveWordToProject(word: string, ev: MouseEvent) {
  ev.stopPropagation()
  projects.addSavedWord(word)
}

/** Click pe cuvânt → popover cu definiție (API: DB, apoi Wikipedia RO, apoi Wiktionary RO). */
const defPop = ref<{
  hit: Hit
  top: number
  left: number
  maxW: number
} | null>(null)
const defLoading = ref(false)
const defText = ref<string | null>(null)
const defSource = ref<'db' | 'wikipedia' | 'wiktionary' | 'none' | null>(null)

let defEscHandler: ((e: KeyboardEvent) => void) | null = null
let defOutsideHandler: ((e: PointerEvent) => void) | null = null

function closeWordDefinition() {
  defPop.value = null
  defText.value = null
  defSource.value = null
  defLoading.value = false
  if (defEscHandler) {
    document.removeEventListener('keydown', defEscHandler)
    defEscHandler = null
  }
  if (defOutsideHandler) {
    document.removeEventListener('pointerdown', defOutsideHandler, true)
    defOutsideHandler = null
  }
}

async function openWordDefinition(hit: Hit, ev: MouseEvent) {
  ev.stopPropagation()
  if (!import.meta.client) return
  const el = ev.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const pad = 8
  const maxW = Math.min(360, window.innerWidth - 2 * pad)
  let left = rect.left + rect.width / 2 - maxW / 2
  left = Math.max(pad, Math.min(left, window.innerWidth - maxW - pad))
  let top = rect.bottom + pad
  const estH = 280
  if (top + estH > window.innerHeight - pad) {
    top = Math.max(pad, rect.top - estH - pad)
  }
  defPop.value = { hit, top, left, maxW }
  defLoading.value = true
  defText.value = hit.definition
  defSource.value = null

  if (defEscHandler) document.removeEventListener('keydown', defEscHandler)
  defEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeWordDefinition()
    }
  }
  document.addEventListener('keydown', defEscHandler)

  if (defOutsideHandler) document.removeEventListener('pointerdown', defOutsideHandler, true)
  defOutsideHandler = (e: PointerEvent) => {
    const pop = document.getElementById('word-def-tooltip')
    const target = e.target as Node | null
    if (!pop || !target) return
    if (!pop.contains(target)) closeWordDefinition()
  }
  // Capture so we close even if the click is handled elsewhere.
  document.addEventListener('pointerdown', defOutsideHandler, true)

  try {
    const res = await $fetch<{
      word: string
      definition: string | null
      source: 'db' | 'wikipedia' | 'wiktionary' | 'none'
    }>('/api/word-definition', { query: { id: hit.id } })
    defText.value = res.definition
    defSource.value = res.source
    const row = results.value.find((x) => x.id === hit.id)
    if (row && res.definition) row.definition = res.definition
  } catch {
    defText.value = null
    defSource.value = 'none'
  } finally {
    defLoading.value = false
  }
}

function addWordFromDefinitionPopover() {
  if (!defPop.value) return
  pickWord(defPop.value.hit.word)
  closeWordDefinition()
}

onUnmounted(() => {
  if (defEscHandler) document.removeEventListener('keydown', defEscHandler)
  if (defOutsideHandler) document.removeEventListener('pointerdown', defOutsideHandler, true)
})

// ── Publish panel ──────────────────────────────────────────────────────────
const { user, isLoggedIn } = useAuth()

const publishOpen = ref(false)
const publishForm = reactive({
  title: '',
  authorName: '',
  language: 'ro',
  tagIds: [] as string[],
})
const publishLoading = ref(false)
const publishMsg = ref<{ ok: boolean; text: string; slug?: string; authorSlug?: string } | null>(null)
const saveLoading = ref(false)
const saveMsg = ref<{ ok: boolean; text: string } | null>(null)
const saveToastVisible = ref(false)
let saveToastTimer: ReturnType<typeof setTimeout> | null = null
/** Apple Notes–style: quiet save after a short idle. */
const AUTOSAVE_MS = 1200
const AUTOSAVE_PREF_KEY = 'poetryhub-write-autosave'
const autosaveEnabled = ref(true)
let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let saveInFlight: Promise<void> | null = null

function readAutosavePref(): boolean {
  if (!import.meta.client) return true
  try {
    const raw = localStorage.getItem(AUTOSAVE_PREF_KEY)
    if (raw === null) return true
    return raw === '1'
  } catch {
    return true
  }
}

function persistAutosavePref(on: boolean) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(AUTOSAVE_PREF_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function setAutosaveEnabled(on: boolean) {
  autosaveEnabled.value = on
  persistAutosavePref(on)
  if (!on) {
    clearAutosaveTimer()
    return
  }
  if (hasUnsavedChanges.value) scheduleAutosave()
}

/** Snapshot of last loaded/saved editor state — save is enabled only when current differs. */
function editorSnapshotKey(title: string, content: string, words: readonly string[]): string {
  const savedWords = [...words]
    .map((w) => w.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  return JSON.stringify({
    title: (title || '').trim(),
    content: content || '',
    savedWords,
  })
}

const lastSavedSnapshot = ref(
  editorSnapshotKey('', '', []),
)

function captureSaveBaseline() {
  lastSavedSnapshot.value = editorSnapshotKey(
    lyrics.title,
    lyrics.text,
    projects.activeSavedWords,
  )
}

const hasUnsavedChanges = computed(() => {
  if (!workspaceReady.value) return false
  return (
    editorSnapshotKey(lyrics.title, lyrics.text, projects.activeSavedWords)
    !== lastSavedSnapshot.value
  )
})

const canSave = computed(() => hasUnsavedChanges.value && !saveLoading.value)

function showSaveToast(ok: boolean, text: string) {
  saveMsg.value = { ok, text }
  saveToastVisible.value = true
  if (saveToastTimer) clearTimeout(saveToastTimer)
  saveToastTimer = setTimeout(() => {
    saveToastVisible.value = false
    saveToastTimer = null
  }, 2800)
}

/** Active server draft for the selected project (null = unsaved local). */
const draftId = computed({
  get: () => projects.currentProject?.draftId ?? null,
  set: (id: string | null) => {
    if (id) projects.linkCurrentDraft(id)
  },
})

interface Tag { id: string; slug: string; name: string; category: string }
const allTags = ref<Tag[]>([])
const tagsLoaded = ref(false)

async function openPublish() {
  if (!isLoggedIn.value) {
    publishMsg.value = { ok: false, text: t('write.loginRequired') }
    publishOpen.value = true
    return
  }
  publishMsg.value = null
  publishForm.title = ''
  publishForm.authorName = user.value?.name ?? user.value?.email?.split('@')[0] ?? ''
  publishForm.tagIds = []
  publishOpen.value = true
  if (!tagsLoaded.value) {
    try {
      allTags.value = await $fetch<Tag[]>('/api/tags')
    } catch {
      // tags are optional, ignore
    } finally {
      tagsLoaded.value = true
    }
  }
}

function closePublish() {
  publishOpen.value = false
}

function clearAutosaveTimer() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
    autosaveTimer = null
  }
}

function scheduleAutosave() {
  if (!import.meta.client) return
  if (!autosaveEnabled.value || !workspaceReady.value || !isLoggedIn.value) return
  clearAutosaveTimer()
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null
    void runAutosave()
  }, AUTOSAVE_MS)
}

async function runAutosave() {
  if (!autosaveEnabled.value || !workspaceReady.value || !isLoggedIn.value) return
  if (!hasUnsavedChanges.value) return
  if (saveLoading.value || saveInFlight) {
    scheduleAutosave()
    return
  }
  await submitSave({ quiet: true })
}

/** Persist immediately (project switch, leave page, tab hide). */
async function flushAutosave() {
  clearAutosaveTimer()
  if (saveInFlight) await saveInFlight
  if (!autosaveEnabled.value || !workspaceReady.value || !isLoggedIn.value) return
  if (!hasUnsavedChanges.value) return
  await submitSave({ quiet: true })
}

async function saveNowDirect() {
  if (!canSave.value) return
  if (!isLoggedIn.value) {
    showSaveToast(false, t('write.loginRequired'))
    return
  }
  clearAutosaveTimer()
  // Always reflect the latest editor state when saving.
  publishForm.title = lyrics.title || ''
  publishForm.authorName = user.value?.name ?? user.value?.email?.split('@')[0] ?? ''
  await submitSave({ quiet: false })
}

function onSaveKeydown(e: KeyboardEvent) {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return
  // Always block the browser "Save page" dialog on this page.
  e.preventDefault()
  if (!workspaceReady.value || !canSave.value) return
  void saveNowDirect()
}

function togglePublishTag(id: string) {
  const idx = publishForm.tagIds.indexOf(id)
  if (idx >= 0) publishForm.tagIds.splice(idx, 1)
  else publishForm.tagIds.push(id)
}

async function submitPublish() {
  const content = toPublishablePoemContent(lyrics.text).trim()
  if (!content) {
    publishMsg.value = { ok: false, text: t('write.contentEmpty') }
    return
  }
  publishMsg.value = null
  publishLoading.value = true
  try {
    // Always persist the latest draft snapshot too (requested: publish also saves).
    await saveDraftInternal()
    const poem = await $fetch<{ slug: string; author: { slug: string } }>('/api/user/poems', {
      method: 'POST',
      credentials: 'include',
      body: {
        title: publishForm.title.trim(),
        content,
        authorName: publishForm.authorName.trim(),
        language: publishForm.language,
        tagIds: publishForm.tagIds,
      },
    })
    publishMsg.value = {
      ok: true,
      text: t('write.published'),
      slug: poem.slug,
      authorSlug: poem.author.slug,
    }
  } catch {
    publishMsg.value = { ok: false, text: t('write.publishError') }
  } finally {
    publishLoading.value = false
  }
}

async function saveDraftInternal(): Promise<void> {
  const content = lyrics.text.trim()

  const title =
    (publishForm.title || lyrics.title || projects.currentProject?.name || '').trim()
    || t('write.untitledDraft')
  const authorName =
    (publishForm.authorName || user.value?.name || user.value?.email?.split('@')[0] || '').trim()
  if (!authorName) {
    throw new Error('missing author')
  }

  // Keep editor title in sync when we had to invent a fallback.
  if (!(lyrics.title || '').trim()) {
    lyrics.title = title
  }
  publishForm.title = title
  publishForm.authorName = authorName

  // First save from an unlisted scratch session creates the listed project.
  projects.ensureListedProject(title)

  const payload = {
    title,
    authorName,
    language: publishForm.language || 'ro',
    content,
    savedWords: [...(projects.activeSavedWords || [])],
  }

  const existingId = draftId.value
  if (existingId) {
    try {
      await $fetch(`/api/user/drafts/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        credentials: 'include',
        body: payload,
      })
      return
    } catch (err: unknown) {
      // Stale draft id (deleted elsewhere) — create a fresh one.
      if (getFetchErrorStatus(err) !== 404) throw err
    }
  }

  const created = await $fetch<{ id: string }>('/api/user/drafts', {
    method: 'POST',
    credentials: 'include',
    body: payload,
  })
  projects.linkCurrentDraft(created.id)
}

// ── First-save poet switch modal ────────────────────────────────────────────
const poetSwitchOpen = ref(false)
const poetSwitchLoading = ref(false)
const POET_SWITCH_SEEN_KEY = 'poetryhub-poet-switch-seen-v1'

function hasSeenPoetSwitch(): boolean {
  if (!import.meta.client) return false
  try {
    return localStorage.getItem(POET_SWITCH_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeenPoetSwitch() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(POET_SWITCH_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

function maybeOpenPoetSwitchModal(wasNewDraft: boolean) {
  if (!wasNewDraft) return
  if (!import.meta.client) return
  if (hasSeenPoetSwitch()) return
  if (!user.value) return
  if (user.value.isPoet) return
  poetSwitchOpen.value = true
  markSeenPoetSwitch()
}

async function confirmPoetSwitch() {
  if (!user.value || poetSwitchLoading.value) return
  poetSwitchLoading.value = true
  try {
    const res = await $fetch<{ id: string; isPoet: boolean }>('/api/user/me/poet', {
      method: 'PATCH',
      body: { isPoet: true },
    })
    user.value = { ...user.value, isPoet: res.isPoet }
    poetSwitchOpen.value = false
  } finally {
    poetSwitchLoading.value = false
  }
}

function closePoetSwitch() {
  poetSwitchOpen.value = false
}

async function submitSave(opts?: { quiet?: boolean }) {
  if (!hasUnsavedChanges.value) return
  if (saveInFlight) {
    await saveInFlight
    if (!hasUnsavedChanges.value) return
  }
  const quiet = opts?.quiet === true
  saveLoading.value = true
  const run = (async () => {
    try {
      const wasNewDraft = !draftId.value
      await saveDraftInternal()
      captureSaveBaseline()
      if (!quiet) showSaveToast(true, t('write.savedDraft'))
      maybeOpenPoetSwitchModal(wasNewDraft)
      // Full list sync on manual save or first create; skip on quiet updates.
      if (isLoggedIn.value && (!quiet || wasNewDraft)) {
        await projects.syncRemoteDrafts()
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message === 'missing author'
          ? t('write.loginRequired')
          : t('write.saveDraftError')
      showSaveToast(false, msg)
    } finally {
      saveLoading.value = false
    }
  })()
  saveInFlight = run.finally(() => {
    saveInFlight = null
  })
  await saveInFlight
}

async function loadDraftById(id: string) {
  try {
    const d = await $fetch<{
      id: string
      title: string
      authorName: string
      language: string
      content: string
      savedWords?: string[]
    }>(
      `/api/user/drafts/${encodeURIComponent(id)}`,
      { credentials: 'include' },
    )
    const match = projects.projects.find((p) => p.draftId === d.id || p.id === d.id)
    if (!match) {
      // Draft opened via URL before sync listed it — ensure it appears as a real project.
      projects.ensureListedProject(d.title || t('write.untitledDraft'))
      projects.linkCurrentDraft(d.id)
    } else {
      projects.selectProject(match.id)
      projects.linkCurrentDraft(d.id)
    }
    lyrics.title = d.title
    lyrics.text = d.content
    projects.setSavedWords(Array.isArray(d.savedWords) ? d.savedWords : [])
    publishForm.title = d.title
    publishForm.authorName = d.authorName
    publishForm.language = d.language || 'ro'
    captureSaveBaseline()
  } catch {
    /* ignore */
  }
}

async function loadDraftFromRoute() {
  const q = route.query.draft
  const id = typeof q === 'string' ? q.trim() : Array.isArray(q) ? String(q[0] ?? '').trim() : ''
  if (!id) return
  await loadDraftById(id)
}

function syncDraftQuery(draft: string | null) {
  if (!import.meta.client) return
  const current = typeof route.query.draft === 'string' ? route.query.draft : ''
  if (draft) {
    if (current === draft) return
    void router.replace({ query: { ...route.query, draft } })
    return
  }
  if (!current) return
  const next = { ...route.query }
  delete next.draft
  void router.replace({ query: next })
}

let suppressProjectWatch = false

/** When switching projects, load remote draft body (local unsaved projects use store state). */
watch(
  () => projects.currentProjectId,
  async (id, prev) => {
    if (suppressProjectWatch || !id || id === prev) return
    clearAutosaveTimer()
    const p = projects.currentProject
    if (!p?.draftId) {
      publishForm.title = p?.title ?? ''
      syncDraftQuery(null)
      captureSaveBaseline()
      return
    }
    suppressProjectWatch = true
    try {
      await loadDraftById(p.draftId)
      syncDraftQuery(p.draftId)
    } finally {
      suppressProjectWatch = false
    }
  },
)

/** Debounce quiet autosave while typing (restarts on every edit). */
watch(
  () => editorSnapshotKey(lyrics.title, lyrics.text, projects.activeSavedWords),
  () => {
    if (!workspaceReady.value || suppressProjectWatch) return
    if (hasUnsavedChanges.value) scheduleAutosave()
    else clearAutosaveTimer()
  },
)

function onWriteVisibilityChange() {
  if (document.visibilityState === 'hidden') void flushAutosave()
}

onBeforeRouteLeave(async () => {
  await flushAutosave()
})

onMounted(async () => {
  suppressProjectWatch = true
  try {
    await projects.init()
    const routeDraft =
      typeof route.query.draft === 'string'
        ? route.query.draft.trim()
        : Array.isArray(route.query.draft)
          ? String(route.query.draft[0] ?? '').trim()
          : ''
    // Always try sync — restores the remembered active project from account drafts.
    await projects.syncRemoteDrafts(routeDraft || null)

    if (routeDraft) {
      await loadDraftFromRoute()
    } else if (projects.currentProject?.draftId) {
      await loadDraftById(projects.currentProject.draftId)
      syncDraftQuery(projects.currentProject.draftId)
    } else if (projects.lastActiveToken) {
      // Preference survived but list restore missed it — open that draft directly.
      await loadDraftById(projects.lastActiveToken)
      if (projects.currentProject?.draftId) {
        syncDraftQuery(projects.currentProject.draftId)
      }
    }
  } finally {
    suppressProjectWatch = false
    workspaceReady.value = true
    writeBootLoading.value = false
    captureSaveBaseline()
  }
  const shouldRerunSearch = restoreSearchState()
  if (shouldRerunSearch) void runSearch()
  if (import.meta.client) {
    document.addEventListener('visibilitychange', onWriteVisibilityChange)
  }
})

// ── Split panes (desktop) ───────────────────────────────────────────────────
const WRITE_RIGHT_WIDTH_KEY = 'poetryhub-write-right-width'
const DEFAULT_RIGHT_WIDTH_PX = 280
/** Coloana dreaptă poate merge între ¼ și ¾ din lățimea containerului (și stânga la fel). */
const RIGHT_COL_MIN_FRAC = 0.25
const RIGHT_COL_MAX_FRAC = 0.75

const splitContainerRef = ref<HTMLElement | null>(null)
const rightWidthPx = ref(DEFAULT_RIGHT_WIDTH_PX)
const isResizingSplit = ref(false)

let resizeStartX = 0
let resizeStartWidth = DEFAULT_RIGHT_WIDTH_PX

function clampRightWidth(w: number, containerWidth: number) {
  const min = containerWidth * RIGHT_COL_MIN_FRAC
  const max = containerWidth * RIGHT_COL_MAX_FRAC
  return Math.min(max, Math.max(min, w))
}

function persistRightWidth() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(WRITE_RIGHT_WIDTH_KEY, String(rightWidthPx.value))
  } catch {
    // ignore quota / private mode
  }
}

function onSplitResizeMove(e: MouseEvent) {
  if (!isResizingSplit.value) return
  const el = splitContainerRef.value
  if (!el) return
  const delta = e.clientX - resizeStartX
  const next = resizeStartWidth - delta
  rightWidthPx.value = clampRightWidth(next, el.getBoundingClientRect().width)
}

function endSplitResize() {
  if (!isResizingSplit.value) return
  isResizingSplit.value = false
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
  document.removeEventListener('mousemove', onSplitResizeMove)
  document.removeEventListener('mouseup', endSplitResize)
  persistRightWidth()
}

function startSplitResize(e: MouseEvent) {
  e.preventDefault()
  resizeStartX = e.clientX
  resizeStartWidth = rightWidthPx.value
  isResizingSplit.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onSplitResizeMove)
  document.addEventListener('mouseup', endSplitResize)
}

function onSplitKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const el = splitContainerRef.value
  if (!el) return
  e.preventDefault()
  const step = e.shiftKey ? 40 : 12
  const cw = el.getBoundingClientRect().width
  if (e.key === 'ArrowLeft') {
    rightWidthPx.value = clampRightWidth(rightWidthPx.value + step, cw)
  } else {
    rightWidthPx.value = clampRightWidth(rightWidthPx.value - step, cw)
  }
  persistRightWidth()
}

function clampRightToContainer() {
  const el = splitContainerRef.value
  if (!el) return
  const cw = el.getBoundingClientRect().width
  rightWidthPx.value = clampRightWidth(rightWidthPx.value, cw)
}

onMounted(() => {
  if (!import.meta.client) return
  autosaveEnabled.value = readAutosavePref()
  try {
    const raw = localStorage.getItem(WRITE_RIGHT_WIDTH_KEY)
    if (raw) {
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n)) {
        const el = splitContainerRef.value
        const cw = el?.getBoundingClientRect().width ?? 1200
        rightWidthPx.value = clampRightWidth(n, cw)
      }
    }
  } catch {
    // ignore
  }
  window.addEventListener('resize', clampRightToContainer)
  document.addEventListener('keydown', onSaveKeydown)
})

onUnmounted(() => {
  writeBootLoading.value = false
  searchGeneration++
  document.removeEventListener('keydown', onSaveKeydown)
  document.removeEventListener('visibilitychange', onWriteVisibilityChange)
  window.removeEventListener('resize', clampRightToContainer)
  document.removeEventListener('mousemove', onSplitResizeMove)
  document.removeEventListener('mouseup', endSplitResize)
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
  clearAutosaveTimer()
  if (saveToastTimer) clearTimeout(saveToastTimer)
  void flushAutosave()
})
</script>

<template>
  <div class="write-split" aria-label="Lucru: dicționar, versuri">
    <div
      v-if="!workspaceReady"
      class="write-split__boot"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="write-split__boot-inner">
        <DsFleuron width="5rem" />
        <span class="write-split__boot-spinner" aria-hidden="true" />
        <p class="write-split__boot-label">{{ t('write.loadingWorkspace') }}</p>
      </div>
    </div>

    <template v-else>
    <WriteToolsBar
      :save-loading="saveLoading"
      :can-save="canSave"
      :autosave-enabled="autosaveEnabled"
      :flush-before-project-change="flushAutosave"
      @save="saveNowDirect"
      @publish="openPublish"
      @update:autosave-enabled="setAutosaveEnabled"
    />

    <Teleport to="body">
      <Transition name="write-split-toast">
        <div
          v-if="saveToastVisible && saveMsg"
          class="ds-banner write-split__toast"
          :class="saveMsg.ok ? 'ds-banner-success' : 'ds-banner-danger'"
          :role="saveMsg.ok ? 'status' : 'alert'"
          aria-live="polite"
        >
          <Icon
            :icon="saveMsg.ok ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'"
            class="write-split__toast-icon"
            :class="saveMsg.ok ? 'write-split__toast-icon--ok' : 'write-split__toast-icon--err'"
            aria-hidden="true"
          />
          <p class="write-split__toast-text">{{ saveMsg.text }}</p>
        </div>
      </Transition>
    </Teleport>

    <div ref="splitContainerRef" class="write-split__container">
      <!-- Stânga (desktop): căutare + rezultate; pe mobil order: versuri → căutare → rezultate (contents + order) -->
      <div class="write-split__left">
        <!-- Bară căutare -->
        <div class="write-split__search-slot" aria-label="Căutare dicționar">
          <div class="write-search">
            <div class="write-search__modes">
              <button
                v-for="m in modes"
                :key="m.id"
                type="button"
                :title="m.hint"
                class="write-search__mode"
                :class="{ 'write-search__mode--active': mode === m.id }"
                @click="selectSearchMode(m.id)"
              >
                {{ m.label }}
              </button>
            </div>

            <div class="write-search__fields">
              <label class="sr-only">Căutare</label>
              <div class="write-search__row">
                <div
                  v-for="(row, i) in searchQueries"
                  :key="row.id"
                  class="write-search__field"
                >
                  <label class="sr-only">Cuvânt căutat {{ i + 1 }}</label>
                  <input
                    :ref="(el) => setSearchInputRef(i, el)"
                    v-model="row.text"
                    type="text"
                    inputmode="search"
                    autocomplete="off"
                    enterkeyhint="search"
                    :placeholder="placeholder"
                    class="write-search__input"
                    :class="{ 'write-search__input--removable': searchQueries.length > 1 }"
                    @focus="activeSearchIndex = i"
                    @keydown.enter.prevent="runSearch"
                  />
                  <button
                    v-if="searchQueries.length > 1"
                    type="button"
                    class="write-search__remove"
                    :title="'Elimină câmpul ' + (i + 1)"
                    :aria-label="'Elimină câmpul ' + (i + 1)"
                    @click="removeSearchQuery(i)"
                  >
                    <Icon icon="heroicons:x-mark" class="write-search__remove-icon" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  class="write-search__add"
                  title="Adaugă alt cuvânt de căutare"
                  aria-label="Adaugă alt cuvânt de căutare"
                  @click="addSearchQuery"
                >
                  <Icon icon="heroicons:plus" class="write-search__add-icon" aria-hidden="true" />
                </button>
              </div>
              <WriteSearchActions
                :can-search="canSearch"
                :loading="loading"
                @search="runSearch"
                @insert-diacritic="insertDiacritic"
              />
            </div>
          </div>
        </div>

        <!-- Rezultate dicționar -->
        <div class="write-results" aria-label="Rezultate dicționar">
          <div class="write-results__panel">
            <p class="write-results__heading">
              Rezultate
              <span v-if="loading" class="write-results__loading">— se încarcă…</span>
            </p>
            <ul v-if="results.length" class="write-results__list">
              <li v-for="r in results" :key="r.id" class="write-results__item">
                <div class="write-results__chip">
                  <button
                    type="button"
                    class="write-results__word"
                    :title="'Definiție: ' + r.word"
                    @click="openWordDefinition(r, $event)"
                  >
                    <span class="write-results__word-text">{{ r.word }}</span>
                  </button>
                  <button
                    type="button"
                    class="write-results__save"
                    :title="projects.isWordSaved(r.word)
                      ? 'Deja în cuvinte salvate'
                      : 'Salvează cuvântul în proiect'"
                    :disabled="projects.isWordSaved(r.word)"
                    aria-label="Salvează în proiect"
                    @click="saveWordToProject(r.word, $event)"
                  >
                    {{ projects.isWordSaved(r.word) ? '✓' : '+' }}
                  </button>
                </div>
              </li>
            </ul>
            <div v-if="results.length && resultsHasMore && !loading" class="write-results__more-wrap">
              <button
                type="button"
                class="write-results__more"
                :disabled="loadingMore"
                @click="loadMoreResults"
              >
                {{ loadingMore ? t('write.loadingMoreResults') : t('write.loadMoreResults') }}
              </button>
            </div>
            <p v-else-if="!loading && !results.length" class="write-results__empty">
              Niciun rezultat. Schimbă modul sau textul căutat.
            </p>
          </div>
        </div>
      </div>

      <!-- Mâner redimensionare (doar desktop) -->
      <div
        class="write-split__handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionează coloanele (săgeți stânga/dreapta)"
        tabindex="0"
        @mousedown="startSplitResize"
        @keydown="onSplitKeydown"
      >
        <div class="write-split__handle-hit" aria-hidden="true" />
        <div class="write-split__handle-bar">
          <span class="write-split__handle-icons" aria-hidden="true">
            <Icon icon="heroicons:chevron-left" class="write-split__handle-icon" />
            <Icon icon="heroicons:chevron-right" class="write-split__handle-icon" />
          </span>
        </div>
      </div>

      <!-- Dreapta: versuri (pe mobil deasupra căutării) -->
      <section
        class="write-split__right"
        :style="{ '--write-right-w': rightWidthPx + 'px' }"
        aria-label="Editor versuri"
      >
        <ClientOnly>
          <WriteLyricsEditor />
          <template #fallback>
            <div class="write-split__skeleton" aria-hidden="true" />
          </template>
        </ClientOnly>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="publish-panel">
        <div v-if="publishOpen" class="write-publish">
          <div class="write-publish__backdrop" @click="closePublish" />
          <div class="write-publish__panel">
            <div class="write-publish__header">
              <h2 class="write-publish__title">{{ t('write.publishTitle') }}</h2>
              <CloseButton :label="t('a11y.close')" @click="closePublish" />
            </div>

            <div class="write-publish__body">
              <div v-if="!isLoggedIn" class="write-publish__login">
                <p class="write-publish__login-text">{{ t('write.loginRequired') }}</p>
                <NuxtLink to="/login?redirect=/write" class="ds-btn-primary" @click="closePublish">
                  {{ t('auth.signIn') }}
                </NuxtLink>
              </div>

              <div v-else-if="publishMsg?.ok" class="write-publish__success">
                <div class="write-publish__success-icon-wrap">
                  <svg
                    class="write-publish__success-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="write-publish__success-text">{{ publishMsg.text }}</p>
                <div class="write-publish__success-actions">
                  <NuxtLink
                    v-if="publishMsg.slug"
                    :to="publishMsg.authorSlug
                      ? { path: `/authors/${publishMsg.authorSlug}`, query: { poem: publishMsg.slug } }
                      : `/poems/${publishMsg.slug}`"
                    class="ds-btn-primary"
                    @click="closePublish"
                  >
                    {{ t('write.viewPoem') }}
                  </NuxtLink>
                  <button type="button" class="ds-btn-secondary" @click="closePublish">
                    {{ t('write.cancel') }}
                  </button>
                </div>
              </div>

              <form v-else class="write-publish__form" @submit.prevent="submitPublish">
                <p class="write-publish__desc">{{ t('write.publishDesc') }}</p>

                <div>
                  <label class="write-publish__label">
                    {{ t('write.fieldTitle') }} *
                  </label>
                  <input
                    v-model="publishForm.title"
                    type="text"
                    :placeholder="t('write.fieldTitlePlaceholder')"
                    required
                    maxlength="500"
                    class="ds-input write-publish__input"
                  />
                </div>

                <div>
                  <label class="write-publish__label">
                    {{ t('write.fieldAuthorName') }} *
                  </label>
                  <input
                    v-model="publishForm.authorName"
                    type="text"
                    required
                    maxlength="80"
                    class="ds-input write-publish__input"
                  />
                  <p class="write-publish__hint">{{ t('write.fieldAuthorNameHint') }}</p>
                </div>

                <div>
                  <label class="write-publish__label">
                    {{ t('write.fieldLanguage') }}
                  </label>
                  <select v-model="publishForm.language" class="ds-input write-publish__input">
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div v-if="allTags.length">
                  <label class="write-publish__label write-publish__label--tags">
                    {{ t('write.fieldTags') }}
                  </label>
                  <div class="write-publish__tags">
                    <button
                      v-for="tag in allTags"
                      :key="tag.id"
                      type="button"
                      class="write-publish__tag"
                      :class="{ 'write-publish__tag--active': publishForm.tagIds.includes(tag.id) }"
                      @click="togglePublishTag(tag.id)"
                    >
                      {{ tag.name }}
                    </button>
                  </div>
                </div>

                <p v-if="publishMsg && !publishMsg.ok" class="write-publish__error">
                  {{ publishMsg.text }}
                </p>

                <div class="write-publish__actions">
                  <button
                    type="submit"
                    :disabled="publishLoading"
                    class="ds-btn-primary write-publish__action"
                  >
                    {{ publishLoading ? t('write.publishing') : t('write.publishBtn') }}
                  </button>
                  <button
                    type="button"
                    class="ds-btn-secondary write-publish__action"
                    @click="closePublish"
                  >
                    {{ t('write.cancel') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="publish-panel">
        <div v-if="poetSwitchOpen" class="write-publish write-publish--poet">
          <div class="write-publish__backdrop" @click="closePoetSwitch" />
          <div
            class="write-publish__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="poet-switch-title"
            @click.stop
          >
            <div class="write-publish__header">
              <h2 id="poet-switch-title" class="write-publish__title">
                {{ t('write.poetSwitchTitle') }}
              </h2>
              <CloseButton :label="t('a11y.close')" @click="closePoetSwitch" />
            </div>

            <div class="write-publish__body write-publish__body--compact">
              <p class="write-publish__copy">
                {{ t('write.poetSwitchDesc') }}
              </p>

              <div class="write-publish__poet-actions">
                <button
                  type="button"
                  class="ds-btn-primary write-publish__action"
                  :disabled="poetSwitchLoading"
                  @click="confirmPoetSwitch"
                >
                  {{ poetSwitchLoading ? t('write.poetSwitching') : t('write.poetSwitchConfirm') }}
                </button>
                <button
                  type="button"
                  class="ds-btn-secondary write-publish__action"
                  :disabled="poetSwitchLoading"
                  @click="closePoetSwitch"
                >
                  {{ t('write.poetSwitchCancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Tooltip: definition next to clicked word (no backdrop) -->
    <div
      v-if="defPop"
      id="word-def-tooltip"
      class="write-results__def"
      :style="{
        top: defPop.top + 'px',
        left: defPop.left + 'px',
        width: defPop.maxW + 'px',
      }"
      role="tooltip"
      aria-labelledby="word-def-tooltip-title"
    >
      <div class="write-results__def-header">
        <h2 id="word-def-tooltip-title" class="write-results__def-title">
          {{ defPop.hit.word }}
        </h2>
        <CloseButton
          class="write-results__def-close"
          :label="t('a11y.close')"
          @click="closeWordDefinition"
        />
      </div>

      <div class="write-results__def-body">
        <p v-if="defLoading" class="write-results__def-muted">Se încarcă definiția…</p>
        <template v-else>
          <p v-if="defText" class="write-results__def-text">{{ defText }}</p>
          <p v-else class="write-results__def-muted">
            Nu există definiție în dicționar și nu s-a găsit nici pe Wikipedia (RO), nici pe Wiktionary (RO).
          </p>
        </template>
      </div>

      <div class="write-results__def-actions">
        <button type="button" class="write-results__def-add" @click="addWordFromDefinitionPopover">
          Adaugă la versuri
        </button>
      </div>
    </div>
    </template>
  </div>
</template>
