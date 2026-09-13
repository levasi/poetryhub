<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWriteLyricsStore } from '~/stores/writeLyrics'
import { useWriteProjectsStore } from '~/stores/writeProjects'
import {
  joinWriteVerseBlocks,
  splitWriteVerseBlocks,
} from '~/utils/writeVerseBlocks'

const { t } = useI18n()
const projects = useWriteProjectsStore()
const lyrics = useWriteLyricsStore()
const { title, text: lyricsText } = storeToRefs(lyrics)

type VerseBlock = { id: string; text: string; column: number }
type ColumnCount = 1 | 2 | 3

const COLUMNS_KEY = 'poetryhub-write-verse-columns-v1'
const COLUMN_OPTIONS: ColumnCount[] = [1, 2, 3]

function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clampCol(col: number, nCols: number): number {
  return Math.max(0, Math.min(nCols - 1, Math.floor(col || 0)))
}

function splitLyrics(raw: string, nCols: number): VerseBlock[] {
  return splitWriteVerseBlocks(raw).map((b, i) => ({
    id: `verse-${i}`,
    text: b.text,
    column: clampCol(b.column, nCols),
  }))
}

function joinBlocks(list: VerseBlock[]): string {
  return joinWriteVerseBlocks(
    list.map(({ text, column }) => ({ text, column })),
  )
}

function loadColumns(): ColumnCount {
  if (!import.meta.client) return 1
  try {
    const raw = localStorage.getItem(COLUMNS_KEY)
    const n = Number(raw)
    if (n === 1 || n === 2 || n === 3) return n
  } catch {
    /* ignore */
  }
  return 1
}

/** Always start at 1 so SSR HTML matches the first client render; restore prefs after mount. */
const columns = ref<ColumnCount>(1)
const blocks = ref<VerseBlock[]>(splitLyrics(lyricsText.value, 1))
const activeBlockId = ref(blocks.value[0]?.id ?? '')
const taRefs = ref<Record<string, HTMLTextAreaElement | null>>({})
const listRef = ref<HTMLElement | null>(null)
const colEls = ref<Record<number, HTMLElement | null>>({})
const cardEls = ref<Record<string, HTMLElement | null>>({})

const draggingId = ref<string | null>(null)
const dragFromId = ref<string | null>(null)
const pointer = ref({ x: 0, y: 0 })

type DropHit = {
  column: number
  /** Insert before this row within the target column (0..length). */
  row: number
  line: { left: number; top: number; width: number; height: number }
}

const dropHit = ref<DropHit | null>(null)

let syncingFromBlocks = false
let columnsReady = false
let dragActive = false

/** Cards grouped by column — empty columns stay visible as drop targets. */
const columnStacks = computed(() => {
  const n = columns.value
  const stacks: VerseBlock[][] = Array.from({ length: n }, () => [])
  for (const b of blocks.value) {
    stacks[clampCol(b.column, n)]!.push(b)
  }
  return stacks
})

function blockPreview(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim()
  if (!line) return '…'
  return line.length > 72 ? `${line.slice(0, 72)}…` : line
}

function flattenColumns(stacks: VerseBlock[][]): VerseBlock[] {
  const next: VerseBlock[] = []
  stacks.forEach((stack, ci) => {
    for (const b of stack) {
      next.push({ ...b, column: ci })
    }
  })
  return next
}

function clampAllColumns(nCols: number) {
  blocks.value = blocks.value.map((b) => ({
    ...b,
    column: clampCol(b.column, nCols),
  }))
}

watch(columns, (n) => {
  if (!import.meta.client || !columnsReady) return
  try {
    localStorage.setItem(COLUMNS_KEY, String(n))
  } catch {
    /* ignore */
  }
  clampAllColumns(n)
  commitBlocks()
  nextTick(fitAll)
})

const dropLineStyle = computed(() => {
  void pointer.value.x
  void pointer.value.y
  if (!draggingId.value || !listRef.value || !dropHit.value) return { display: 'none' as const }
  const listRect = listRef.value.getBoundingClientRect()
  const { line } = dropHit.value
  return {
    display: 'block' as const,
    left: `${line.left - listRect.left}px`,
    top: `${line.top - listRect.top}px`,
    width: `${line.width}px`,
    height: '2px',
  }
})

const dragPreview = computed(() => {
  if (!draggingId.value) return null
  const block = blocks.value.find((b) => b.id === draggingId.value)
  if (!block) return null
  const n = blocks.value.indexOf(block) + 1
  return {
    label: t('write.verseBlockLabel', { n }),
    preview: blockPreview(block.text),
  }
})

function setTaRef(id: string, el: unknown) {
  taRefs.value[id] = el instanceof HTMLTextAreaElement ? el : null
  if (el instanceof HTMLTextAreaElement) nextTick(() => fitTextarea(id))
}

function setCardRef(id: string, el: unknown) {
  cardEls.value[id] = el instanceof HTMLElement ? el : null
}

function setColRef(col: number, el: unknown) {
  colEls.value[col] = el instanceof HTMLElement ? el : null
}

function fitTextarea(id: string) {
  const el = taRefs.value[id]
  if (!el) return
  el.style.height = '0px'
  el.style.height = `${Math.max(el.scrollHeight, 72)}px`
}

function fitAll() {
  for (const b of blocks.value) fitTextarea(b.id)
}

function commitBlocks() {
  syncingFromBlocks = true
  lyricsText.value = joinBlocks(blocks.value)
  nextTick(() => {
    syncingFromBlocks = false
    fitAll()
  })
}

watch(
  lyricsText,
  (v) => {
    if (syncingFromBlocks) return
    if (joinBlocks(blocks.value) === v) return
    blocks.value = splitLyrics(v, columns.value)
    activeBlockId.value = blocks.value[0]?.id ?? ''
    nextTick(fitAll)
  },
)

function onBlockInput(id: string, value: string) {
  const b = blocks.value.find((x) => x.id === id)
  if (!b) return
  b.text = value
  commitBlocks()
  nextTick(() => fitTextarea(id))
}

function insertBlock(nb: VerseBlock, afterId?: string) {
  if (afterId) {
    const after = blocks.value.find((b) => b.id === afterId)
    if (after) nb.column = after.column
    const idx = blocks.value.findIndex((b) => b.id === afterId)
    if (idx >= 0) {
      blocks.value.splice(idx + 1, 0, nb)
      activeBlockId.value = nb.id
      commitBlocks()
      nextTick(() => {
        fitTextarea(nb.id)
        taRefs.value[nb.id]?.focus()
      })
      return
    }
  }
  blocks.value.push(nb)
  activeBlockId.value = nb.id
  commitBlocks()
  nextTick(() => {
    fitTextarea(nb.id)
    taRefs.value[nb.id]?.focus()
  })
}

function addBlock(afterId?: string) {
  const col = afterId
    ? (blocks.value.find((b) => b.id === afterId)?.column ?? 0)
    : (blocks.value.find((b) => b.id === activeBlockId.value)?.column ?? 0)
  insertBlock(
    { id: newBlockId(), text: '', column: clampCol(col, columns.value) },
    afterId,
  )
}

function computeDropHit(clientX: number, clientY: number): DropHit {
  const nCols = columns.value
  const list = listRef.value?.getBoundingClientRect()

  // Which column is under the pointer?
  let bestCol = 0
  let bestColDist = Infinity
  for (let c = 0; c < nCols; c++) {
    const el = colEls.value[c]
    if (!el) continue
    const r = el.getBoundingClientRect()
    const dx = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0
    const dist = dx * dx
    if (dist < bestColDist) {
      bestColDist = dist
      bestCol = c
    }
  }

  const colEl = colEls.value[bestCol]
  const colRect = colEl?.getBoundingClientRect()
  const stack = columnStacks.value[bestCol] ?? []
  const others = stack.filter((b) => b.id !== draggingId.value)

  let row = others.length
  let lineTop = colRect ? colRect.top + 8 : clientY
  let lineLeft = colRect?.left ?? clientX
  let lineWidth = colRect?.width ?? 120

  if (others.length === 0) {
    return {
      column: bestCol,
      row: 0,
      line: {
        left: lineLeft + 4,
        top: lineTop,
        width: Math.max(lineWidth - 8, 40),
        height: 2,
      },
    }
  }

  for (let i = 0; i < others.length; i++) {
    const card = cardEls.value[others[i]!.id]
    if (!card) continue
    const r = card.getBoundingClientRect()
    const mid = r.top + r.height / 2
    if (clientY < mid) {
      row = i
      lineTop = r.top
      lineLeft = r.left
      lineWidth = r.width
      break
    }
    row = i + 1
    lineTop = r.bottom
    lineLeft = r.left
    lineWidth = r.width
  }

  return {
    column: bestCol,
    row,
    line: {
      left: lineLeft,
      top: lineTop - 1,
      width: lineWidth,
      height: 2,
    },
  }
}

function applyDropHit(clientX: number, clientY: number) {
  dropHit.value = computeDropHit(clientX, clientY)
}

function onPointerMove(e: PointerEvent) {
  if (!dragActive || !draggingId.value) return
  pointer.value = { x: e.clientX, y: e.clientY }
  applyDropHit(e.clientX, e.clientY)
}

function finishDrag(commit: boolean) {
  if (!dragActive) return
  dragActive = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')

  const id = dragFromId.value
  const hit = dropHit.value

  draggingId.value = null
  dragFromId.value = null
  dropHit.value = null

  if (!commit || !id || !hit) return

  const stacks = columnStacks.value.map((s) => s.slice())
  let fromCol = -1
  let fromRow = -1
  for (let c = 0; c < stacks.length; c++) {
    const idx = stacks[c]!.findIndex((b) => b.id === id)
    if (idx >= 0) {
      fromCol = c
      fromRow = idx
      break
    }
  }
  if (fromCol < 0 || fromRow < 0) return

  const [item] = stacks[fromCol]!.splice(fromRow, 1)
  if (!item) return

  let toRow = hit.row
  // If removing from an earlier row in the same column, adjust insert index.
  if (fromCol === hit.column && fromRow < toRow) toRow -= 1
  toRow = Math.max(0, Math.min(stacks[hit.column]!.length, toRow))

  item.column = hit.column
  stacks[hit.column]!.splice(toRow, 0, item)

  // No-op if nothing changed.
  const samePlace = fromCol === hit.column && fromRow === toRow
  if (samePlace) return

  blocks.value = flattenColumns(stacks)
  commitBlocks()
  nextTick(fitAll)
}

function onPointerUp() {
  finishDrag(true)
}

function onPointerCancel() {
  finishDrag(false)
}

function onDragHandlePointerDown(blockId: string, e: PointerEvent) {
  if (e.button !== 0) return
  // Allow dragging a single card into another (empty) column when multi-col.
  if (blocks.value.length < 1) return
  if (blocks.value.length < 2 && columns.value === 1) return
  e.preventDefault()

  dragActive = true
  draggingId.value = blockId
  dragFromId.value = blockId
  pointer.value = { x: e.clientX, y: e.clientY }
  applyDropHit(e.clientX, e.clientY)

  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
}

onMounted(() => {
  const n = loadColumns()
  columns.value = n
  clampAllColumns(n)
  columnsReady = true
  nextTick(fitAll)
})

onBeforeUnmount(() => {
  finishDrag(false)
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <div class="rounded-xl bg-surface-raised p-2 shadow-ds-card sm:p-4">
      <label for="lyrics-title" class="font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
        Titlu
      </label>
      <input
        id="lyrics-title"
        v-model="title"
        type="text"
        autocomplete="off"
        class="my-2 w-full rounded-xl bg-surface-subtle/50 px-3 py-2 text-base text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        placeholder="Titlul poeziei…"
      >

      <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
        <label class="font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
          Versuri
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <div
            class="inline-flex overflow-hidden rounded-lg border border-edge-subtle bg-surface-subtle"
            role="group"
            :aria-label="t('write.verseColumnsAria')"
          >
            <button
              v-for="n in COLUMN_OPTIONS"
              :key="n"
              type="button"
              class="min-w-[2.25rem] px-2.5 py-1.5 text-xs font-semibold transition"
              :class="columns === n
                ? 'bg-brand text-brand-foreground'
                : 'text-content-secondary hover:bg-surface-raised hover:text-content'"
              :aria-pressed="columns === n"
              @click="columns = n"
            >
              {{ n }}
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand-tint"
            @click="addBlock()"
          >
            <Icon icon="heroicons:plus" class="h-4 w-4" aria-hidden="true" />
            {{ t('write.addVerseBlock') }}
          </button>
        </div>
      </div>

      <ClientOnly>
        <div
          ref="listRef"
          class="relative mt-2 flex items-start gap-3"
          :class="draggingId ? 'select-none' : ''"
        >
          <div
            v-for="(stack, colIndex) in columnStacks"
            :key="colIndex"
            :ref="(el) => setColRef(colIndex, el)"
            class="flex min-h-[6rem] min-w-0 flex-1 flex-col gap-3 rounded-xl border border-dashed border-transparent p-0.5 transition"
            :class="draggingId ? 'border-edge-subtle/60 bg-surface-subtle/20' : ''"
          >
            <div
              v-for="block in stack"
              :key="block.id"
              :ref="(el) => setCardRef(block.id, el)"
              class="flex items-stretch gap-1 rounded-xl border border-edge-subtle/80 bg-surface-subtle/40 p-2 transition"
              :class="[
                activeBlockId === block.id ? 'ring-1 ring-brand/20' : '',
                draggingId === block.id ? 'opacity-40' : '',
              ]"
            >
              <textarea
                :id="`lyrics-block-${block.id}`"
                :ref="(el) => setTaRef(block.id, el)"
                :value="block.text"
                rows="2"
                class="block min-w-0 flex-1 cursor-text overflow-hidden rounded-xl bg-surface-raised px-3 py-2 font-serif text-base leading-relaxed text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                placeholder="Scrie versuri aici…"
                spellcheck="true"
                @focus="activeBlockId = block.id"
                @input="onBlockInput(block.id, ($event.target as HTMLTextAreaElement).value)"
              />
              <div
                class="inline-flex w-8 shrink-0 cursor-grab items-center justify-center self-stretch rounded-lg text-content-muted transition hover:bg-surface-raised hover:text-content active:cursor-grabbing"
                role="button"
                tabindex="0"
                :aria-label="t('write.dragVerseBlock')"
                :title="t('write.dragVerseBlock')"
                @pointerdown="onDragHandlePointerDown(block.id, $event)"
              >
                <Icon icon="heroicons:bars-3" class="h-4 w-4 rotate-90 pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div
            v-show="draggingId && dropHit"
            class="pointer-events-none absolute z-20 rounded-full bg-brand shadow-[0_0_0_2px_rgba(255,255,255,0.65)]"
            :style="dropLineStyle"
            aria-hidden="true"
          >
            <span class="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-brand" />
            <span class="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-brand" />
          </div>
        </div>

        <Teleport to="body">
          <div
            v-if="draggingId && dragPreview"
            class="pointer-events-none fixed z-[80] max-w-xs rounded-lg border border-brand/40 bg-surface-raised px-2.5 py-1.5 shadow-lg"
            :style="{
              left: `${pointer.x + 12}px`,
              top: `${pointer.y + 12}px`,
            }"
          >
            <p
              class="text-[10px] font-semibold uppercase tracking-wide text-content-soft"
            >
              {{ dragPreview.label }}
            </p>
            <p class="truncate font-serif text-xs text-content-secondary">
              {{ dragPreview.preview }}
            </p>
          </div>
        </Teleport>

        <template #fallback>
          <div class="mt-2 h-28 animate-pulse rounded-xl bg-surface-subtle/50" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <div v-if="projects.currentProject" class="rounded-xl bg-surface-raised p-2 shadow-ds-card sm:p-4">
      <h3 class="font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
        Cuvinte salvate
      </h3>
      <p class="mt-1 text-[11px] text-content-muted">
        Din rezultatele căutării, butonul + adaugă cuvântul la proiectul selectat.
      </p>
      <ul v-if="projects.currentProject.savedWords.length" class="mt-3 flex flex-wrap gap-1.5">
        <li
          v-for="w in projects.currentProject.savedWords"
          :key="w"
          class="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-content-secondary"
        >
          <span>{{ w }}</span>
          <button
            type="button"
            class="rounded p-0.5 text-content-muted hover:bg-surface-subtle hover:text-content"
            title="Elimină"
            @click="projects.removeSavedWord(w)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-else class="mt-3 text-xs text-content-muted">Niciun cuvânt salvat încă.</p>
    </div>
  </div>
</template>
