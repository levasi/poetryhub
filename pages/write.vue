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
      </section>
    </div>

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
