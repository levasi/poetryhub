<script setup lang="ts">
import type { SearchMode } from '~/lib/rhyme/wordQueries'
import { Icon } from '@iconify/vue'
import WriteLyricsEditor from '~/components/write/LyricsEditor.vue'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()

useHead({
  title: () => t('write.seoTitle'),
  meta: [{ name: 'description', content: () => t('write.seoDesc') }],
})

const lyrics = useWriteLyricsStore()
const projects = useWriteProjectsStore()

// —— Căutare dicționar
const modes: { id: SearchMode; label: string; hint: string }[] = [
  { id: 'fuzzy', label: 'Potrivire', hint: 'Căutare fuzzy în dicționar' },
  { id: 'starts', label: 'Începe cu', hint: 'Prefix' },
  { id: 'ends', label: 'Se termină cu', hint: 'Sufix' },
  { id: 'contains', label: 'Conține', hint: 'Subșir în cuvânt' },
  { id: 'anagram', label: 'Anagramă', hint: 'Aceleași litere' },
  { id: 'exact', label: 'Exact', hint: 'Formă exactă' },
]

const mode = ref<SearchMode>('contains')
const loading = ref(false)

/** Dacă true, „mar” nu potrivește „măr” (fără pliere diacritice la căutare). */
const strictDiacritics = ref(false)

let nextSearchQueryId = 0
interface SearchQueryRow {
  id: number
  text: string
}

/** Unul sau mai multe câmpuri de căutare; rezultatele se unesc (fără duplicate). */
const searchQueries = ref<SearchQueryRow[]>([{ id: ++nextSearchQueryId, text: '' }])

function nonEmptySearchTerms(): string[] {
  return searchQueries.value.map((r) => r.text.trim()).filter(Boolean)
}

function addSearchQuery() {
  searchQueries.value.push({ id: ++nextSearchQueryId, text: '' })
}

function removeSearchQuery(index: number) {
  if (searchQueries.value.length <= 1) {
    searchQueries.value[0]!.text = ''
    return
  }
  searchQueries.value.splice(index, 1)
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRunSearch() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    void runSearch()
  }, 320)
}

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

/** Cuvinte afișate în ordinea: cele mai scurte înainte celor mai lungi; la egalitate, alfabetic (ro). */
const resultsSortedByWordLength = computed(() => {
  return [...results.value].sort((a, b) => {
    const la = a.word.length
    const lb = b.word.length
    if (la !== lb) return la - lb
    return a.word.localeCompare(b.word, 'ro')
  })
})

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
    default:
      return 'Scrie un cuvânt sau o parte din el…'
  }
})

/** Aliniat cu plafonul din `server/api/words.get.ts` (max 5000). */
const WORDS_LIMIT = 5000

async function runSearch() {
  const terms = nonEmptySearchTerms()
  if (terms.length === 0) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const seen = new Set<string>()
    const merged: Hit[] = []
    const responses = await Promise.all(
      terms.map((query) => {
        const queryParams: Record<string, string | number> = {
          q: query,
          mode: mode.value,
          limit: WORDS_LIMIT,
          strictDiacritics: strictDiacritics.value ? 1 : 0,
        }
        if (mode.value === 'contains') {
          queryParams.useSyllablesInSearch = 0
        }
        return $fetch<{ results: Hit[] }>('/api/words', {
          query: queryParams,
        })
      })
    )
    for (const res of responses) {
      for (const h of res.results) {
        if (!seen.has(h.id)) {
          seen.add(h.id)
          merged.push(h)
        }
      }
    }
    results.value = merged
  } finally {
    loading.value = false
  }
}

watch(mode, () => {
  void runSearch()
})

watch(strictDiacritics, () => {
  if (nonEmptySearchTerms().length) void runSearch()
})

watch(searchQueries, () => scheduleRunSearch(), { deep: true })

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

const draftId = ref<string | null>(null)
const DRAFT_ID_KEY = 'poetryhub-write-draft-id-v1'

function loadDraftIdLocal() {
  if (!import.meta.client) return
  try {
    const v = localStorage.getItem(DRAFT_ID_KEY)
    draftId.value = v && v.trim() ? v.trim() : null
  } catch {
    draftId.value = null
  }
}

function persistDraftIdLocal(id: string | null) {
  if (!import.meta.client) return
  try {
    if (!id) localStorage.removeItem(DRAFT_ID_KEY)
    else localStorage.setItem(DRAFT_ID_KEY, id)
  } catch {
    /* ignore */
  }
}

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

async function saveNowDirect() {
  if (saveLoading.value) return
  if (!isLoggedIn.value) {
    saveMsg.value = { ok: false, text: t('write.loginRequired') }
    return
  }
  // Always reflect the latest editor state when saving.
  publishForm.title = lyrics.title || ''
  publishForm.authorName = user.value?.name ?? user.value?.email?.split('@')[0] ?? ''
  await submitSave()
}

function togglePublishTag(id: string) {
  const idx = publishForm.tagIds.indexOf(id)
  if (idx >= 0) publishForm.tagIds.splice(idx, 1)
  else publishForm.tagIds.push(id)
}

async function submitPublish() {
  const content = lyrics.text.trim()
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
  if (!content) {
    throw new Error('empty content')
  }
  const payload = {
    title: (publishForm.title || lyrics.title).trim(),
    authorName: publishForm.authorName.trim(),
    language: publishForm.language,
    content,
  }
  if (!payload.title || !payload.authorName) {
    throw new Error('missing fields')
  }

  if (draftId.value) {
    await $fetch(`/api/user/drafts/${encodeURIComponent(draftId.value)}`, {
      method: 'PUT',
      credentials: 'include',
      body: payload,
    })
    return
  }

  const created = await $fetch<{ id: string }>('/api/user/drafts', {
    method: 'POST',
    credentials: 'include',
    body: payload,
  })
  draftId.value = created.id
  persistDraftIdLocal(created.id)
}

async function submitSave() {
  const content = lyrics.text.trim()
  if (!content) {
    saveMsg.value = { ok: false, text: t('write.contentEmpty') }
    return
  }
  saveMsg.value = null
  saveLoading.value = true
  try {
    await saveDraftInternal()
    saveMsg.value = { ok: true, text: t('write.savedDraft') }
  } catch {
    saveMsg.value = { ok: false, text: t('write.saveDraftError') }
  } finally {
    saveLoading.value = false
  }
}

async function loadDraftFromRoute() {
  const q = route.query.draft
  const id = typeof q === 'string' ? q.trim() : Array.isArray(q) ? String(q[0] ?? '').trim() : ''
  if (!id) return
  try {
    const d = await $fetch<{ id: string; title: string; authorName: string; language: string; content: string }>(
      `/api/user/drafts/${encodeURIComponent(id)}`,
      { credentials: 'include' },
    )
    draftId.value = d.id
    persistDraftIdLocal(d.id)
    lyrics.title = d.title
    lyrics.text = d.content
    publishForm.title = d.title
    publishForm.authorName = d.authorName
    publishForm.language = d.language || 'ro'
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  loadDraftIdLocal()
  void loadDraftFromRoute()
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
})

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  window.removeEventListener('resize', clampRightToContainer)
  document.removeEventListener('mousemove', onSplitResizeMove)
  document.removeEventListener('mouseup', endSplitResize)
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
})
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col" aria-label="Lucru: dicționar, versuri">
    <WriteToolsBar />
    <div ref="splitContainerRef" class="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row pb-8">
      <!-- Stânga (desktop): căutare + rezultate; pe mobil order: versuri → căutare → rezultate (contents + order) -->
      <div
        class="contents min-h-0 min-w-0 lg:order-1 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-4 sm:pr-4 sm:pb-6">
        <!-- Bară căutare -->
        <div class="order-2 shrink-0 lg:order-none" aria-label="Căutare dicționar">
          <div
            class="shrink-0 rounded-xl border border-edge-subtle bg-surface-raised p-2 my-2 sm:my-0 shadow-sm sm:p-4">
            <div class="flex flex-wrap gap-2">
              <button v-for="m in modes" :key="m.id" type="button" :title="m.hint"
                class="rounded-lg border px-3 py-1.5 text-xs font-medium transition" :class="mode === m.id
                  ? 'border-brand bg-brand-soft/40 text-content shadow-sm'
                  : 'border-edge-subtle bg-surface-subtle text-content-secondary hover:border-edge'
                  " @click="mode = m.id">
                {{ m.label }}
              </button>
            </div>

            <div class="mt-4">
              <label class="sr-only">Căutare</label>
              <div class="flex flex-wrap items-center gap-2">
                <div v-for="(row, i) in searchQueries" :key="row.id"
                  class="flex min-w-0 max-w-[min(100%,20rem)] flex-[1_1_11rem] items-center gap-1.5 sm:flex-[1_1_13rem]">
                  <label class="sr-only">Cuvânt căutat {{ i + 1 }}</label>
                  <input v-model="row.text" type="search" autocomplete="off" enterkeyhint="search"
                    :placeholder="placeholder"
                    class="min-w-0 flex-1 rounded-xl border border-edge bg-surface-raised px-3 py-2.5 text-base text-content shadow-inner outline-none ring-blue-500/20 transition placeholder:text-sm placeholder:text-content-soft focus:border-blue-500 focus:ring-2 sm:min-w-[10rem] sm:px-4 sm:py-3"
                    @keydown.enter.prevent="runSearch" />
                  <button v-if="searchQueries.length > 1" type="button"
                    class="shrink-0 rounded-lg border border-edge-subtle px-2 py-2 text-content-muted hover:bg-surface-subtle sm:px-2.5"
                    :title="'Elimină câmpul ' + (i + 1)" @click="removeSearchQuery(i)">
                    ×
                  </button>
                </div>
                <button type="button"
                  class="inline-flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl border border-dashed border-brand/45 bg-brand-soft/30 text-brand transition hover:border-brand hover:bg-brand-soft/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                  title="Adaugă alt cuvânt de căutare" aria-label="Adaugă alt cuvânt de căutare"
                  @click="addSearchQuery">
                  <Icon icon="heroicons:plus" class="h-6 w-6 shrink-0 text-current" aria-hidden="true" />
                </button>
              </div>
              <button type="button"
                class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                :disabled="loading" @click="runSearch">
                <Icon icon="heroicons:magnifying-glass" class="h-5 w-5 shrink-0" aria-hidden="true" />
                {{ t('write.searchBtn') }}
              </button>
              <label class="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-content-secondary">
                <input v-model="strictDiacritics" type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 rounded border-edge text-blue-600 focus:ring-blue-500" />
                <span>
                  <span class="font-medium">Diacritice fixe</span>
                  <span class="mt-0.5 block text-xs font-normal text-content-muted">
                    Dacă e bifat, literele cu diacritice sunt distincte (ex. „mar” nu potrivește „măr”). Debifat =
                    potrivire largă (a ≈ ă, î ≈ i etc.).
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Rezultate dicționar -->
        <div class="order-3 flex min-h-0 min-w-0 flex-1 flex-col lg:order-none lg:min-h-0 lg:flex-none lg:p-0"
          aria-label="Rezultate dicționar">
          <div
            class="flex min-w-0 flex-col rounded-xl border border-edge-subtle bg-surface-raised p-2 shadow-sm sm:p-4">
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-content-muted">
              Rezultate
              <span v-if="loading" class="font-normal text-content-soft">— se încarcă…</span>
            </p>
            <ul v-if="results.length" class="flex flex-wrap content-start gap-2 rounded-xl">
              <li v-for="r in resultsSortedByWordLength" :key="r.id" class="min-w-0 max-w-full">
                <div
                  class="group relative inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-lg bg-surface-subtle/50 p-1 transition hover:border-blue-200 hover:bg-blue-50/80">
                  <button type="button" class="flex min-w-0 max-w-[12rem] items-center justify-center rounded-md"
                    :title="'Definiție: ' + r.word" @click="openWordDefinition(r, $event)">
                    <span class="min-w-0 truncate text-sm font-semibold leading-tight text-content">{{ r.word }}</span>
                  </button>
                  <button type="button"
                    class="shrink-0 rounded-md bg-surface-raised p-1 text-sm font-semibold leading-none text-blue-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :title="projects.isWordSaved(r.word)
                      ? 'Deja în cuvinte salvate'
                      : 'Salvează cuvântul în proiect'
                      " :disabled="projects.isWordSaved(r.word)" aria-label="Salvează în proiect"
                    @click="saveWordToProject(r.word, $event)">
                    {{ projects.isWordSaved(r.word) ? '✓' : '+' }}
                  </button>
                </div>
              </li>
            </ul>
            <p v-else-if="!loading"
              class="rounded-xl border border-dashed border-edge-subtle px-4 py-8 text-center text-sm text-content-muted">
              Niciun rezultat. Schimbă modul sau textul căutat.
            </p>
          </div>
        </div>
      </div>

      <!-- Mâner redimensionare (doar desktop) -->
      <div class="group relative order-2 hidden shrink-0 items-stretch justify-center lg:flex" role="separator"
        aria-orientation="vertical" aria-label="Redimensionează coloanele (săgeți stânga/dreapta)" tabindex="0"
        @mousedown="startSplitResize" @keydown="onSplitKeydown">
        <div class="absolute inset-y-0 -left-2 -right-2 z-[1] cursor-col-resize" aria-hidden="true" />
        <div
          class="relative z-0 flex w-[1.625rem] flex-col items-center justify-start border border-edge-subtle bg-surface-subtle/90 px-0.5 py-3 shadow-sm transition-colors group-hover:border-brand/50 group-hover:bg-brand-soft/50 group-focus-visible:border-brand group-focus-visible:ring-2 group-focus-visible:ring-brand/30">
          <span
            class="pointer-events-none flex items-center gap-px text-content-muted group-hover:text-brand group-focus-visible:text-brand"
            aria-hidden="true">
            <Icon icon="heroicons:chevron-left" class="h-3.5 w-3.5 shrink-0" />
            <Icon icon="heroicons:chevron-right" class="h-3.5 w-3.5 shrink-0" />
          </span>
        </div>
      </div>

      <!-- Dreapta: versuri (pe mobil deasupra căutării) -->
      <section class="write-split-right order-1 flex min-w-0 flex-col sm:pl-4 lg:order-3"
        :style="{ '--write-right-w': rightWidthPx + 'px' }" aria-label="Editor versuri">
        <ClientOnly>
          <WriteLyricsEditor />
          <template #fallback>
            <div class="h-48 animate-pulse rounded-xl bg-surface-subtle" aria-hidden="true" />
          </template>
        </ClientOnly>
        <div class="mt-2 shrink-0 flex gap-2 sm:grid-cols-2">
          <button type="button" class="ds-btn-secondary w-full gap-2 shadow-ds-card" :disabled="saveLoading"
            @click="saveNowDirect">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 9h6M9 13h6M9 17h4" />
            </svg>
            {{ saveLoading ? t('write.savingDraft') : t('write.saveBtn') }}
          </button>

          <button type="button" class="ds-btn-primary w-full gap-2 shadow-ds-card" @click="openPublish">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {{ t('write.publishBtn') }}
          </button>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="publish-panel">
        <div v-if="publishOpen" class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closePublish" />
          <div
            class="relative z-10 w-full max-w-lg rounded-t-2xl border border-edge-subtle bg-surface-raised shadow-ds-popover sm:rounded-ds-xl">
            <div class="flex items-center justify-between border-b border-edge-subtle px-6 py-4">
              <h2 class="text-base font-semibold text-content">{{ t('write.publishTitle') }}</h2>
              <button type="button"
                class="rounded-lg p-1.5 text-content-soft hover:bg-surface-subtle hover:text-content-secondary"
                @click="closePublish">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="max-h-[80vh] overflow-y-auto px-6 py-5">
              <div v-if="!isLoggedIn" class="py-4 text-center">
                <p class="mb-4 text-sm text-content-muted">{{ t('write.loginRequired') }}</p>
                <NuxtLink to="/login?redirect=/write" class="ds-btn-primary inline-flex" @click="closePublish">
                  {{ t('auth.signIn') }}
                </NuxtLink>
              </div>

              <div v-else-if="publishMsg?.ok" class="py-4 text-center">
                <div
                  class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft/40 ring-1 ring-brand/25">
                  <svg class="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="mb-4 font-medium text-content">{{ publishMsg.text }}</p>
                <div class="flex flex-wrap justify-center gap-3">
                  <NuxtLink v-if="publishMsg.slug" :to="publishMsg.authorSlug
                    ? { path: `/authors/${publishMsg.authorSlug}`, query: { poem: publishMsg.slug } }
                    : `/poems/${publishMsg.slug}`" class="ds-btn-primary" @click="closePublish">
                    {{ t('write.viewPoem') }}
                  </NuxtLink>
                  <button type="button" class="ds-btn-secondary" @click="closePublish">
                    {{ t('write.cancel') }}
                  </button>
                </div>
              </div>

              <form v-else class="space-y-4" @submit.prevent="submitPublish">
                <p class="text-sm text-content-muted">{{ t('write.publishDesc') }}</p>

                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-muted">
                    {{ t('write.fieldTitle') }} *
                  </label>
                  <input v-model="publishForm.title" type="text" :placeholder="t('write.fieldTitlePlaceholder')"
                    required maxlength="500" class="ds-input px-4 py-2.5" />
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-muted">
                    {{ t('write.fieldAuthorName') }} *
                  </label>
                  <input v-model="publishForm.authorName" type="text" required maxlength="80"
                    class="ds-input px-4 py-2.5" />
                  <p class="mt-1 text-xs text-content-soft">{{ t('write.fieldAuthorNameHint') }}</p>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-muted">
                    {{ t('write.fieldLanguage') }}
                  </label>
                  <select v-model="publishForm.language" class="ds-input px-4 py-2.5">
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div v-if="allTags.length">
                  <label class="mb-2 block text-xs font-medium uppercase tracking-widest text-content-muted">
                    {{ t('write.fieldTags') }}
                  </label>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="tag in allTags" :key="tag.id" type="button"
                      :class="publishForm.tagIds.includes(tag.id)
                        ? 'border-brand bg-brand-soft/35 text-brand shadow-sm ring-1 ring-brand/20'
                        : 'border-edge-subtle bg-surface-subtle text-content-muted hover:border-edge hover:bg-surface-raised'"
                      class="rounded-full border px-3 py-1 text-xs font-medium transition"
                      @click="togglePublishTag(tag.id)">
                      {{ tag.name }}
                    </button>
                  </div>
                </div>

                <p v-if="publishMsg && !publishMsg.ok"
                  class="rounded-ds-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-sm text-danger">
                  {{ publishMsg.text }}
                </p>

                <div class="flex flex-wrap gap-3 pt-1">
                  <button type="submit" :disabled="publishLoading" class="ds-btn-primary px-5">
                    {{ publishLoading ? t('write.publishing') : t('write.publishBtn') }}
                  </button>
                  <button type="button" class="ds-btn-secondary px-5" @click="closePublish">
                    {{ t('write.cancel') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Tooltip: definition next to clicked word (no backdrop) -->
    <div
      v-if="defPop"
      id="word-def-tooltip"
      class="fixed z-[90] max-h-[min(22rem,70vh)] overflow-y-auto rounded-xl border border-edge-subtle bg-surface-raised p-4 shadow-2xl ring-1 ring-black/10"
      :style="{
        top: defPop.top + 'px',
        left: defPop.left + 'px',
        width: defPop.maxW + 'px',
      }"
      role="tooltip"
      aria-labelledby="word-def-tooltip-title"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 id="word-def-tooltip-title" class="font-display text-base font-semibold text-content">
          {{ defPop.hit.word }}
        </h2>
        <button
          type="button"
          class="-mt-1 -mr-1 rounded-lg p-1.5 text-content-soft hover:bg-surface-subtle hover:text-content-secondary"
          aria-label="Închide"
          @click="closeWordDefinition"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mt-3 text-sm leading-relaxed text-content-secondary">
        <p v-if="defLoading" class="text-content-muted">Se încarcă definiția…</p>
        <template v-else>
          <p v-if="defText" class="whitespace-pre-wrap">{{ defText }}</p>
          <p v-else class="text-content-muted">
            Nu există definiție în dicționar și nu s-a găsit nici pe Wikipedia (RO), nici pe Wiktionary (RO).
          </p>
        </template>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          @click="addWordFromDefinitionPopover"
        >
          Adaugă la versuri
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Lățime coloană dreaptă doar pe desktop; pe mobil rămâne 100%. */
.write-split-right {
  width: 100%;
}

@media (min-width: 1024px) {
  .write-split-right {
    width: var(--write-right-w, 280px);
    flex-shrink: 0;
  }
}

.publish-panel-enter-active,
.publish-panel-leave-active {
  transition: opacity 0.2s ease;
}

.publish-panel-enter-active .relative.z-10,
.publish-panel-leave-active .relative.z-10 {
  transition: transform 0.25s ease, opacity 0.2s ease;
}

.publish-panel-enter-from,
.publish-panel-leave-to {
  opacity: 0;
}

.publish-panel-enter-from .relative.z-10,
.publish-panel-leave-to .relative.z-10 {
  transform: translateY(1.5rem);
  opacity: 0;
}
</style>
