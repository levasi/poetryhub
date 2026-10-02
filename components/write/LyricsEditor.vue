<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWriteLyricsStore } from '~/stores/writeLyrics'
import { useWriteProjectsStore } from '~/stores/writeProjects'
import {
  joinWriteVerseBlocks,
  readWriteColumnCount,
  splitWriteVerseBlocks,
  type WriteColumnCount,
} from '~/utils/writeVerseBlocks'

const { t } = useI18n()
const projects = useWriteProjectsStore()
const lyrics = useWriteLyricsStore()
const { title, text: lyricsText } = storeToRefs(lyrics)

const savedWordDraft = ref('')
const savedWordInputOpen = ref(false)
const savedWordInputRef = ref<HTMLInputElement | null>(null)
const savedWordAddBtnRef = ref<HTMLButtonElement | null>(null)
const savedWordTooltipRef = ref<HTMLElement | null>(null)
const savedWordTooltipPos = ref<{ top: number; left: number; width: number } | null>(null)

const canAddSavedWord = computed(() => savedWordDraft.value.trim().length > 0)

let savedWordOutsideHandler: ((e: PointerEvent) => void) | null = null
let savedWordEscHandler: ((e: KeyboardEvent) => void) | null = null

function clearSavedWordListeners() {
  if (savedWordOutsideHandler) {
    document.removeEventListener('pointerdown', savedWordOutsideHandler, true)
    savedWordOutsideHandler = null
  }
  if (savedWordEscHandler) {
    document.removeEventListener('keydown', savedWordEscHandler)
    savedWordEscHandler = null
  }
  if (import.meta.client) {
    window.removeEventListener('resize', placeSavedWordTooltip)
    window.removeEventListener('scroll', placeSavedWordTooltip, true)
  }
}

function placeSavedWordTooltip() {
  const btn = savedWordAddBtnRef.value
  if (!btn || !import.meta.client) return
  const rect = btn.getBoundingClientRect()
  const pad = 8
  const width = Math.min(280, window.innerWidth - 2 * pad)
  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(pad, Math.min(left, window.innerWidth - width - pad))

  const tipEl = savedWordTooltipRef.value
  const estH = tipEl?.getBoundingClientRect().height || 56
  // Prefer above the plus; fall back below only if there isn't room.
  let top = rect.top - estH - pad
  if (top < pad) {
    top = Math.min(rect.bottom + pad, window.innerHeight - estH - pad)
  }
  savedWordTooltipPos.value = { top, left, width }
}

async function openSavedWordInput() {
  if (!import.meta.client) return
  placeSavedWordTooltip()
  savedWordInputOpen.value = true
  await nextTick()
  placeSavedWordTooltip()
  savedWordInputRef.value?.focus()

  clearSavedWordListeners()
  savedWordOutsideHandler = (e: PointerEvent) => {
    const target = e.target as Node
    if (savedWordTooltipRef.value?.contains(target)) return
    if (savedWordAddBtnRef.value?.contains(target)) return
    closeSavedWordInput()
  }
  savedWordEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeSavedWordInput()
    }
  }
  document.addEventListener('pointerdown', savedWordOutsideHandler, true)
  document.addEventListener('keydown', savedWordEscHandler)
  window.addEventListener('resize', placeSavedWordTooltip)
  window.addEventListener('scroll', placeSavedWordTooltip, true)
}

function closeSavedWordInput() {
  savedWordInputOpen.value = false
  savedWordDraft.value = ''
  savedWordTooltipPos.value = null
  clearSavedWordListeners()
}

function confirmSavedWord() {
  const word = savedWordDraft.value.trim()
  if (!word) return
  projects.addSavedWord(word)
  closeSavedWordInput()
}

function toggleSavedWordInput() {
  if (savedWordInputOpen.value) closeSavedWordInput()
  else void openSavedWordInput()
}

type VerseBlock = { id: string; text: string; column: number }
type ColumnCount = WriteColumnCount

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

/** Keep stored column indices — do not clamp to the current UI column count. */
function splitLyrics(raw: string): VerseBlock[] {
  return splitWriteVerseBlocks(raw).map((b, i) => ({
    id: `verse-${i}`,
    text: b.text,
    column: Math.max(0, Math.floor(b.column || 0)),
  }))
}

function joinBlocks(list: VerseBlock[]): string {
  return joinWriteVerseBlocks(
    list.map(({ text, column }) => ({ text, column })),
    columns.value,
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

function flattenColumns(
  stacks: VerseBlock[][],
  movedId?: string | null,
  movedColumn?: number,
): VerseBlock[] {
  const next: VerseBlock[] = []
  stacks.forEach((stack) => {
    for (const b of stack) {
      next.push({
        ...b,
        // Preserve stored columns when the UI has fewer columns (overflow is only visual).
        column:
          movedId && b.id === movedId && movedColumn != null
            ? movedColumn
            : b.column,
      })
    }
  })
  return next
}

function clampAllColumns(nCols: number) {
  // Intentionally no-op for persistence: stored columns survive layout changes.
  void nCols
}

watch(columns, (n) => {
  if (!import.meta.client || !columnsReady) return
  try {
    localStorage.setItem(COLUMNS_KEY, String(n))
  } catch {
    /* ignore */
  }
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

/** Insert a blank stanza at the top of a column (before the first quatrain). */
function addBlockAtColumnStart(colIndex: number) {
  const col = clampCol(colIndex, columns.value)
  const nb: VerseBlock = { id: newBlockId(), text: '', column: col }
  const first = columnStacks.value[col]?.[0]
  if (first) {
    const idx = blocks.value.findIndex((b) => b.id === first.id)
    if (idx >= 0) {
      blocks.value.splice(idx, 0, nb)
      activeBlockId.value = nb.id
      commitBlocks()
      nextTick(() => {
        fitTextarea(nb.id)
        taRefs.value[nb.id]?.focus()
      })
      return
    }
  }
  insertBlock(nb)
}

function removeBlock(id: string) {
  const idx = blocks.value.findIndex((b) => b.id === id)
  if (idx < 0) return

  if (blocks.value.length === 1) {
    blocks.value[0]!.text = ''
    activeBlockId.value = blocks.value[0]!.id
    commitBlocks()
    nextTick(() => {
      fitTextarea(blocks.value[0]!.id)
      taRefs.value[blocks.value[0]!.id]?.focus()
    })
    return
  }

  const focusId =
    blocks.value[idx + 1]?.id ?? blocks.value[idx - 1]?.id ?? null
  blocks.value.splice(idx, 1)
  delete taRefs.value[id]
  delete cardEls.value[id]
  if (activeBlockId.value === id) activeBlockId.value = focusId
  if (draggingId.value === id) draggingId.value = null
  commitBlocks()
  nextTick(() => {
    if (focusId) {
      fitTextarea(focusId)
      taRefs.value[focusId]?.focus()
    }
  })
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
  clearSavedWordListeners()
})
</script>

<template>
  <div class="write-editor">
    <div class="write-editor__panel">
      <label for="lyrics-title" class="write-editor__label">
        Titlu
      </label>
      <input id="lyrics-title" v-model="title" type="text" autocomplete="off" class="write-editor__title-input"
        placeholder="Titlul poeziei…">

      <div class="write-editor__toolbar">
        <label class="write-editor__label">
          Versuri
        </label>
        <div class="write-editor__toolbar-actions">
          <div class="write-editor__columns" role="group" :aria-label="t('write.verseColumnsAria')">
            <button v-for="n in COLUMN_OPTIONS" :key="n" type="button" class="write-editor__column-btn"
              :class="{ 'write-editor__column-btn--active': columns === n }" :aria-pressed="columns === n"
              @click="columns = n">
              {{ n }}
            </button>
          </div>
        </div>
      </div>

      <ClientOnly>
        <div ref="listRef" class="write-editor__list" :class="{ 'write-editor__list--dragging': !!draggingId }">
          <div v-for="(stack, colIndex) in columnStacks" :key="colIndex" :ref="(el) => setColRef(colIndex, el)"
            class="write-editor__column" :class="{ 'write-editor__column--drop-target': !!draggingId }">
            <div class="write-editor__insert-bar" :class="{ 'write-editor__insert-bar--idle': !!draggingId }">
              <button type="button" class="write-editor__insert-bar-btn" :disabled="!!draggingId"
                :title="t('write.insertVerseBlock')" :aria-label="t('write.insertVerseBlock')"
                @click="addBlockAtColumnStart(colIndex)">
                <Icon icon="heroicons:plus" class="write-editor__insert-icon" aria-hidden="true" />
              </button>
            </div>
            <template v-for="block in stack" :key="block.id">
              <div class="write-editor__card-wrap">
                <div :ref="(el) => setCardRef(block.id, el)" class="write-editor__card" :class="{
                  'write-editor__card--active': activeBlockId === block.id,
                  'write-editor__card--dragging': draggingId === block.id,
                }">
                  <textarea :id="`lyrics-block-${block.id}`" :ref="(el) => setTaRef(block.id, el)" :value="block.text"
                    rows="2" class="write-editor__textarea" placeholder="Scrie versuri aici…" spellcheck="true"
                    @focus="activeBlockId = block.id"
                    @input="onBlockInput(block.id, ($event.target as HTMLTextAreaElement).value)" />
                  <div class="write-editor__card-aside">
                    <button type="button" class="write-editor__remove-block" :title="t('write.removeVerseBlock')"
                      :aria-label="t('write.removeVerseBlock')" @click="removeBlock(block.id)">
                      <Icon icon="heroicons:trash" class="write-editor__remove-icon" aria-hidden="true" />
                    </button>
                    <div class="write-editor__drag-handle" role="button" tabindex="0"
                      :aria-label="t('write.dragVerseBlock')" :title="t('write.dragVerseBlock')"
                      @pointerdown="onDragHandlePointerDown(block.id, $event)">
                      <Icon icon="heroicons:arrows-pointing-out" class="write-editor__drag-icon" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="write-editor__insert-bar" :class="{ 'write-editor__insert-bar--idle': !!draggingId }">
                <button type="button" class="write-editor__insert-bar-btn" :disabled="!!draggingId"
                  :title="t('write.insertVerseBlock')" :aria-label="t('write.insertVerseBlock')"
                  @click="addBlock(block.id)">
                  <Icon icon="heroicons:plus" class="write-editor__insert-icon" aria-hidden="true" />
                </button>
              </div>
            </template>
          </div>

          <div v-show="draggingId && dropHit" class="write-editor__drop-line" :style="dropLineStyle" aria-hidden="true">
            <span class="write-editor__drop-dot write-editor__drop-dot--start" />
            <span class="write-editor__drop-dot write-editor__drop-dot--end" />
          </div>
        </div>

        <Teleport to="body">
          <div v-if="draggingId && dragPreview" class="write-editor__drag-preview" :style="{
            left: `${pointer.x + 12}px`,
            top: `${pointer.y + 12}px`,
          }">
            <p class="write-editor__drag-preview-label">
              {{ dragPreview.label }}
            </p>
            <p class="write-editor__drag-preview-text">
              {{ dragPreview.preview }}
            </p>
          </div>
        </Teleport>

        <template #fallback>
          <div class="write-editor__skeleton" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <div class="write-editor__panel">
      <h3 class="write-editor__label">
        Cuvinte salvate
      </h3>
      <p class="write-editor__saved-hint">
        Adaugă cuvinte cu + sau din rezultatele căutării.
      </p>
      <ul class="write-editor__saved-list" aria-label="Cuvinte salvate">
        <li v-for="w in projects.activeSavedWords" :key="w" class="write-editor__saved-chip">
          <span>{{ w }}</span>
          <button type="button" class="write-editor__saved-remove" title="Elimină" @click="projects.removeSavedWord(w)">
            ×
          </button>
        </li>
        <li class="write-editor__saved-add">
          <button ref="savedWordAddBtnRef" type="button" class="write-editor__saved-add-btn" title="Adaugă cuvânt"
            aria-label="Adaugă cuvânt" :aria-expanded="savedWordInputOpen" aria-haspopup="dialog"
            aria-controls="write-saved-word-tooltip" @click="toggleSavedWordInput">
            <Icon icon="heroicons:plus" class="write-editor__saved-add-icon" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <Teleport to="body">
        <form v-if="savedWordInputOpen && savedWordTooltipPos" id="write-saved-word-tooltip" ref="savedWordTooltipRef"
          class="write-editor__saved-form" role="dialog" aria-label="Adaugă cuvânt salvat" :style="{
            top: `${savedWordTooltipPos.top}px`,
            left: `${savedWordTooltipPos.left}px`,
            width: `${savedWordTooltipPos.width}px`,
          }" @submit.prevent="confirmSavedWord">
          <label class="sr-only" for="write-saved-word-input">Cuvânt de salvat</label>
          <input id="write-saved-word-input" ref="savedWordInputRef" v-model="savedWordDraft" type="text"
            class="write-editor__saved-input" placeholder="ex. lumină" autocomplete="off" />
          <button type="submit" class="write-editor__saved-submit" :disabled="!canAddSavedWord">
            Adaugă
          </button>
        </form>
      </Teleport>
    </div>
  </div>
</template>
