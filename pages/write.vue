<script setup lang="ts">
import type { SearchMode } from '~/lib/rhyme/wordQueries'
import { normForSearch, normalizeWord } from '~/lib/rhyme/normalize'
import { splitSyllables } from '~/lib/rhyme/syllableParser'
import WriteLyricsEditor from '~/components/write/LyricsEditor.vue'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()

useHead({
  title: () => t('write.seoTitle'),
  meta: [{ name: 'description', content: () => t('write.seoDesc') }],
})

const lyrics = useWriteLyricsStore()
const projects = useWriteProjectsStore()

// —— Căutare cuvinte
const modes: { id: SearchMode; label: string; hint: string }[] = [
  { id: 'fuzzy', label: 'Potrivire', hint: 'Căutare fuzzy în dicționar' },
  { id: 'starts', label: 'Începe cu', hint: 'Prefix' },
  { id: 'ends', label: 'Se termină cu', hint: 'Sufix' },
  { id: 'contains', label: 'Conține', hint: 'Subșir' },
  { id: 'anagram', label: 'Anagramă', hint: 'Aceleași litere' },
  { id: 'exact', label: 'Exact', hint: 'Formă exactă' },
]

const mode = ref<SearchMode>('contains')
const q = ref('')
const loading = ref(false)

/** Dacă true, „mar” nu potrivește „măr” (fără pliere diacritice la căutare). */
const strictDiacritics = ref(false)

/** Mod „Conține”: folosește logica OR pe silabe (implicit) sau doar subșir pe întreg cuvântul. */
const useSyllablesInSearch = ref(true)

let nextSyllableSlotId = 0
interface SyllableSlot {
  id: number
  text: string
}
/** Câte un câmp per silabă; poți adăuga silabe care nu apar în împărțirea automată. */
const syllableSlots = ref<SyllableSlot[]>([])

function syllablePartsFromSlots(): string[] {
  return syllableSlots.value.map((s) => s.text.trim()).filter(Boolean)
}

function syncSyllableSlotsFromQuery() {
  if (mode.value !== 'contains') return
  const parts = splitSyllables(q.value.trim())
  syllableSlots.value = parts.length
    ? parts.map((text) => ({ id: ++nextSyllableSlotId, text }))
    : [{ id: ++nextSyllableSlotId, text: '' }]
}

function addSyllableSlot() {
  syllableSlots.value.push({ id: ++nextSyllableSlotId, text: '' })
}

function removeSyllableSlot(index: number) {
  if (syllableSlots.value.length <= 1) {
    syllableSlots.value[0]!.text = ''
    return
  }
  syllableSlots.value.splice(index, 1)
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

/** Silabe pentru textul din câmp (aceeași euristică ca la server) */
const querySyllables = computed(() => {
  const t = q.value.trim()
  if (!t) return [] as string[]
  return splitSyllables(t)
})

/** Pentru previzualizare: același lucru ca pe server (`lib/wordQueries` „Conține”). */
const containsMatchers = computed(() => {
  if (mode.value !== 'contains') return [] as string[]
  const needle = normalizeWord(q.value)
  if (!needle) return [] as string[]
  const st = strictDiacritics.value
  const fullNorm = normForSearch(needle, st)
  if (!useSyllablesInSearch.value) return [fullNorm]
  const syllables = syllableSlots.value.map((s) => s.text.trim()).filter(Boolean)
  const effective = syllables.length > 0 ? syllables : splitSyllables(needle)
  if (effective.length < 2) return [fullNorm]
  const parts = effective
    .map((s) => normForSearch(s, st))
    .filter((s) => s.length >= 2)
  return [...new Set([...parts, fullNorm])].filter((m) => m.length > 0)
})

watch(
  [q, mode],
  () => {
    syncSyllableSlotsFromQuery()
  },
  { immediate: true }
)

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
  const query = q.value.trim()
  if (!query) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const queryParams: Record<string, string | number> = {
      q: query,
      mode: mode.value,
      limit: WORDS_LIMIT,
      strictDiacritics: strictDiacritics.value ? 1 : 0,
    }
    if (mode.value === 'contains') {
      queryParams.useSyllablesInSearch = useSyllablesInSearch.value ? 1 : 0
      if (useSyllablesInSearch.value) {
        const parts = syllablePartsFromSlots()
        if (parts.length > 0) {
          queryParams.syllablesOverride = JSON.stringify(parts)
        }
      }
    }
    const res = await $fetch<{ results: Hit[] }>('/api/words', {
      query: queryParams,
    })
    results.value = res.results
  } finally {
    loading.value = false
  }
}

watch(mode, () => {
  void runSearch()
})

watch(useSyllablesInSearch, () => {
  if (mode.value === 'contains' && q.value.trim()) void runSearch()
})

watch(strictDiacritics, () => {
  if (q.value.trim()) void runSearch()
})

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

function closeWordDefinition() {
  defPop.value = null
  defText.value = null
  defSource.value = null
  defLoading.value = false
  if (defEscHandler) {
    document.removeEventListener('keydown', defEscHandler)
    defEscHandler = null
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
const publishMsg = ref<{ ok: boolean; text: string; slug?: string } | null>(null)

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
    const poem = await $fetch<{ slug: string }>('/api/user/poems', {
      method: 'POST',
      body: {
        title: publishForm.title.trim(),
        content,
        authorName: publishForm.authorName.trim(),
        language: publishForm.language,
        tagIds: publishForm.tagIds,
      },
    })
    publishMsg.value = { ok: true, text: t('write.published'), slug: poem.slug }
  } catch {
    publishMsg.value = { ok: false, text: t('write.publishError') }
  } finally {
    publishLoading.value = false
  }
}
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col" aria-label="Lucru: dicționar, versuri">
    <WriteToolsBar />
    <div
      class="grid min-h-0 min-w-0 flex-1 grid-cols-1 divide-y divide-slate-200 lg:grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] lg:divide-y-0">
      <!-- Stânga: căutare și rezultate -->
      <section class="flex min-w-0 flex-col gap-4 p-3 sm:p-4 lg:pr-5" aria-label="Căutare dicționar">
        <!-- Bară căutare -->
        <div class="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div class="mt-4 flex flex-wrap gap-2">
            <button v-for="m in modes" :key="m.id" type="button" :title="m.hint"
              class="rounded-lg border px-3 py-1.5 text-xs font-medium transition" :class="mode === m.id
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                " @click="mode = m.id">
              {{ m.label }}
            </button>
          </div>

          <div class="mt-4">
            <label class="sr-only">Căutare</label>
            <p class="mb-1.5 text-xs text-slate-500">Apasă Enter pentru a căuta.</p>
            <input v-model="q" type="search" autocomplete="off" enterkeyhint="search" :placeholder="placeholder"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-inner outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2"
              @keydown.enter.prevent="runSearch" />
            <label class="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-slate-800">
              <input v-model="strictDiacritics" type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span>
                <span class="font-medium">Diacritice fixe</span>
                <span class="mt-0.5 block text-xs font-normal text-slate-600">
                  Dacă e bifat, literele cu diacritice sunt distincte (ex. „mar” nu potrivește „măr”). Debifat =
                  potrivire largă (a ≈ ă, î ≈ i etc.).
                </span>
              </span>
            </label>
          </div>

          <div v-if="querySyllables.length || (mode === 'contains' && q.trim())"
            class="mt-3 space-y-3 rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2">
            <template v-if="mode === 'contains' && q.trim()">
              <label class="flex cursor-pointer items-start gap-2.5 text-sm text-slate-800">
                <input v-model="useSyllablesInSearch" type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>
                  <span class="font-medium">Folosește silabele în căutare</span>
                  <span class="mt-0.5 block text-xs font-normal text-slate-600">
                    Dacă e bifat, „Conține” caută OR pe părți (silabe ≥2 caractere) și pe întregul text pliat;
                    dacă nu, doar subșir pe cuvântul normalizat.
                  </span>
                </span>
              </label>
              <div v-if="useSyllablesInSearch" class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Silabe</p>
                <p class="text-[11px] text-slate-600">
                  Câte un câmp; poți corecta împărțirea sau adăuga silabe care nu apar în cuvânt. La schimbarea
                  textului căutat, silabele se resincronizează. <span class="font-medium text-slate-700">Enter</span>
                  în orice câmp pornește căutarea.
                </p>
                <div class="flex flex-wrap items-end gap-2">
                  <div v-for="(slot, i) in syllableSlots" :key="slot.id"
                    class="flex min-w-[5.5rem] max-w-[min(100%,11rem)] flex-1 flex-col gap-0.5">
                    <span class="text-[10px] text-slate-500">Silabă {{ i + 1 }}</span>
                    <div class="flex gap-1">
                      <input v-model="slot.text" type="text" spellcheck="false" autocomplete="off" enterkeyhint="search"
                        class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm text-slate-900 outline-none ring-blue-500/20 focus:border-blue-500 focus:ring-2"
                        @keydown.enter.prevent="runSearch" />
                      <button v-if="syllableSlots.length > 1" type="button"
                        class="shrink-0 rounded border border-slate-200 px-2 py-1 text-sm leading-none text-slate-600 hover:bg-slate-100"
                        :title="'Elimină silaba ' + (i + 1)" @click="removeSyllableSlot(i)">
                        ×
                      </button>
                    </div>
                  </div>
                  <button type="button"
                    class="shrink-0 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-800"
                    @click="addSyllableSlot">
                    + Adaugă silabă
                  </button>
                </div>
                <button type="button"
                  class="mt-1 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                  @click="runSearch">
                  Caută
                </button>
              </div>
              <p v-else class="text-xs text-slate-600">
                Căutare doar ca subșir pe textul pliat (fără împărțire pe silabe).
              </p>
            </template>

            <div v-if="querySyllables.length && !(mode === 'contains' && useSyllablesInSearch)">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Silabe (euristică)</p>
              <p class="mt-1 font-mono text-sm leading-relaxed text-slate-900">
                <span v-for="(syl, idx) in querySyllables" :key="idx" class="inline-flex items-center">
                  <span v-if="idx > 0" class="mx-1.5 text-slate-300" aria-hidden="true">·</span>
                  <span>{{ syl }}</span>
                </span>
              </p>
            </div>

            <p v-if="mode === 'contains' && q.trim() && containsMatchers.length"
              class="border-t border-slate-200/80 pt-2 text-[11px] text-slate-600">
              <span class="font-medium text-slate-700">Șiruri căutate (forma pliată):</span>
              {{ containsMatchers.join(', ') }}
            </p>
          </div>
        </div>

        <!-- Rezultate dicționar -->
        <div class="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Rezultate
            <span v-if="loading" class="font-normal text-slate-400">— se încarcă…</span>
          </p>
          <ul v-if="results.length"
            class="grid auto-rows-min grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 content-start sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            <li v-for="r in results" :key="r.id" class="min-w-0">
              <div
                class="group relative flex h-full gap-0.5 rounded-lg border border-slate-100 bg-slate-50/50 p-1 transition hover:border-blue-200 hover:bg-blue-50/80">
                <button type="button" class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md text-center"
                  :title="'Definiție: ' + r.word" @click="openWordDefinition(r, $event)">
                  <span class="w-full truncate text-sm font-semibold leading-tight text-slate-900">{{ r.word }}</span>
                </button>
                <button type="button"
                  class="shrink-0 self-start rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-sm font-semibold leading-none text-blue-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
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
            class="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Niciun rezultat. Schimbă modul sau textul căutat.
          </p>
        </div>
      </section>

      <!-- Dreapta: versuri -->
      <section class="flex min-w-0 flex-col p-3 sm:p-4" aria-label="Editor versuri">
        <ClientOnly>
          <WriteLyricsEditor />
          <template #fallback>
            <div class="h-48 animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />
          </template>
        </ClientOnly>
        <!-- Publish button -->
        <div class="mt-3 shrink-0">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 hover:text-blue-800"
            @click="openPublish"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {{ t('write.publishBtn') }}
          </button>
        </div>
      </section>
    </div>

    <!-- Publish panel -->
    <Teleport to="body">
      <Transition name="publish-panel">
        <div v-if="publishOpen" class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closePublish" />
          <div class="relative z-10 w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 class="text-base font-semibold text-slate-900">{{ t('write.publishTitle') }}</h2>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" @click="closePublish">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="max-h-[80vh] overflow-y-auto px-6 py-5">
              <!-- Not logged in state -->
              <div v-if="!isLoggedIn" class="py-4 text-center">
                <p class="mb-4 text-sm text-slate-600">{{ t('write.loginRequired') }}</p>
                <NuxtLink to="/login?redirect=/write" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" @click="closePublish">
                  {{ t('auth.signIn') }}
                </NuxtLink>
              </div>

              <!-- Success state -->
              <div v-else-if="publishMsg?.ok" class="py-4 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="mb-4 font-medium text-slate-900">{{ publishMsg.text }}</p>
                <div class="flex justify-center gap-3">
                  <NuxtLink
                    v-if="publishMsg.slug"
                    :to="`/poems/${publishMsg.slug}`"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    @click="closePublish"
                  >
                    {{ t('write.viewPoem') }}
                  </NuxtLink>
                  <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closePublish">
                    {{ t('write.cancel') }}
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form v-else class="space-y-4" @submit.prevent="submitPublish">
                <p class="text-sm text-slate-500">{{ t('write.publishDesc') }}</p>

                <!-- Title -->
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                    {{ t('write.fieldTitle') }} *
                  </label>
                  <input
                    v-model="publishForm.title"
                    type="text"
                    :placeholder="t('write.fieldTitlePlaceholder')"
                    required
                    maxlength="500"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <!-- Author name -->
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                    {{ t('write.fieldAuthorName') }} *
                  </label>
                  <input
                    v-model="publishForm.authorName"
                    type="text"
                    required
                    maxlength="80"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p class="mt-1 text-xs text-slate-400">{{ t('write.fieldAuthorNameHint') }}</p>
                </div>

                <!-- Language -->
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                    {{ t('write.fieldLanguage') }}
                  </label>
                  <select
                    v-model="publishForm.language"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <!-- Tags -->
                <div v-if="allTags.length">
                  <label class="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500">
                    {{ t('write.fieldTags') }}
                  </label>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="tag in allTags"
                      :key="tag.id"
                      type="button"
                      :class="publishForm.tagIds.includes(tag.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'"
                      class="rounded-full border px-3 py-1 text-xs font-medium transition"
                      @click="togglePublishTag(tag.id)"
                    >
                      {{ tag.name }}
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <p v-if="publishMsg && !publishMsg.ok" class="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {{ publishMsg.text }}
                </p>

                <div class="flex gap-3 pt-1">
                  <button
                    type="submit"
                    :disabled="publishLoading"
                    class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {{ publishLoading ? t('write.publishing') : t('write.publishBtn') }}
                  </button>
                  <button type="button" class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50" @click="closePublish">
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
      <div v-if="defPop" class="fixed inset-0 z-[90]">
        <div class="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" aria-hidden="true"
          @click="closeWordDefinition" />
        <div
          class="absolute z-[91] max-h-[min(22rem,70vh)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-950/5"
          :style="{
            top: defPop.top + 'px',
            left: defPop.left + 'px',
            width: defPop.maxW + 'px',
          }" role="dialog" aria-modal="true" aria-labelledby="word-def-popover-title" @click.stop>
          <h2 id="word-def-popover-title" class="font-display text-base font-semibold text-slate-900">
            {{ defPop.hit.word }}
          </h2>
          <div class="mt-3 text-sm leading-relaxed text-slate-700">
            <p v-if="defLoading" class="text-slate-500">Se încarcă definiția…</p>
            <template v-else>
              <p v-if="defText" class="whitespace-pre-wrap">{{ defText }}</p>
              <p v-else class="text-slate-500">
                Nu există definiție în dicționar și nu s-a găsit nici pe Wikipedia (RO), nici pe Wiktionary (RO).
              </p>
            </template>
          </div>
          <p v-if="!defLoading && defSource === 'wikipedia'" class="mt-2 text-[11px] text-slate-400">
            Sursă: Wikipedia (limba română) — salvată în baza de date.
          </p>
          <p v-if="!defLoading && defSource === 'wiktionary'" class="mt-2 text-[11px] text-slate-400">
            Sursă: Wiktionary (limba română) — salvată în baza de date.
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button"
              class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              @click="addWordFromDefinitionPopover">
              Adaugă la versuri
            </button>
            <button type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeWordDefinition">
              Închide
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
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
