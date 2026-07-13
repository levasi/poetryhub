<script setup lang="ts">
import {
  READER_FONT_DESC_I18N_KEYS,
  READER_FONT_I18N_KEYS,
  READER_LETTER_SPACING_MAX,
  READER_LETTER_SPACING_MIN,
  READER_LETTER_SPACING_STEP,
  READER_LINE_HEIGHT_MAX,
  READER_LINE_HEIGHT_MIN,
  READER_LINE_HEIGHT_STEP,
} from '~/composables/useReaderPreferences'

const { t } = useI18n()
const { isLoggedIn } = useAuth()

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    /** Prefix for form control ids (must be unique per instance). */
    idPrefix?: string
  }>(),
  { idPrefix: 'reader' },
)

const {
  fontKey,
  fontSizePx,
  lineHeight,
  letterSpacingEm,
  onReaderPreferenceChange,
  cycleFont,
  fontOptions,
} = useReaderPreferences()

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function decFontSize() {
  fontSizePx.value = clamp(Math.round(fontSizePx.value - 1), 16, 48)
  onReaderPreferenceChange()
}
function incFontSize() {
  fontSizePx.value = clamp(Math.round(fontSizePx.value + 1), 16, 48)
  onReaderPreferenceChange()
}

function decLineHeight() {
  lineHeight.value = clamp(
    Math.round((lineHeight.value - READER_LINE_HEIGHT_STEP) * 100) / 100,
    READER_LINE_HEIGHT_MIN,
    READER_LINE_HEIGHT_MAX,
  )
  onReaderPreferenceChange()
}
function incLineHeight() {
  lineHeight.value = clamp(
    Math.round((lineHeight.value + READER_LINE_HEIGHT_STEP) * 100) / 100,
    READER_LINE_HEIGHT_MIN,
    READER_LINE_HEIGHT_MAX,
  )
  onReaderPreferenceChange()
}

function decLetterSpacing() {
  letterSpacingEm.value = clamp(
    Math.round((letterSpacingEm.value - READER_LETTER_SPACING_STEP) * 1000) / 1000,
    READER_LETTER_SPACING_MIN,
    READER_LETTER_SPACING_MAX,
  )
  onReaderPreferenceChange()
}
function incLetterSpacing() {
  letterSpacingEm.value = clamp(
    Math.round((letterSpacingEm.value + READER_LETTER_SPACING_STEP) * 1000) / 1000,
    READER_LETTER_SPACING_MIN,
    READER_LETTER_SPACING_MAX,
  )
  onReaderPreferenceChange()
}


function id(suffix: string) {
  return `${props.idPrefix}-${suffix}`
}

const panelEl = ref<HTMLElement | null>(null)

watchEffect((onCleanup) => {
  if (!open.value) return
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') open.value = false
  }
  document.addEventListener('keydown', onEsc)
  onCleanup(() => document.removeEventListener('keydown', onEsc))
})

watchEffect((onCleanup) => {
  if (!open.value) return
  let remove: (() => void) | undefined
  const stop = nextTick(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = panelEl.value
      const t = e.target
      if (!el || !(t instanceof Node) || el.contains(t)) return
      open.value = false
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    remove = () => document.removeEventListener('pointerdown', onPointerDown, true)
  })
  onCleanup(() => {
    stop.then(() => remove?.())
  })
})

</script>

<template>
  <Teleport to="body">
    <aside ref="panelEl" class="fixed inset-x-0 bottom-0 z-[211] w-full transition-[max-height] duration-300 ease-out"
      :class="open
        ? 'bg-surface-overlay shadow-2xl ring-1 ring-edge-subtle/60'
        : 'bg-transparent shadow-none ring-0'" role="dialog" aria-modal="false" :aria-labelledby="id('title')"
      @click.stop :style="{ maxHeight: open ? '24rem' : '3.25rem' }">
      <!-- Pin to panel top edge: -top-full was relative to the tall inner wrapper when open, which shoved the control up the viewport -->
      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-2">
        <div class="pointer-events-auto flex w-full max-w-content justify-end">
          <button type="button"
            class="reader-settings-toggle inline-flex h-8 min-w-[2.75rem] -translate-y-full items-center justify-center rounded-ds-md bg-surface-overlay/95 text-content-secondary shadow-ds-card backdrop-blur-sm transition hover:border-edge hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay"
            :aria-label="open ? t('viewer.closeReadingSettings') : t('viewer.openReadingSettings')"
            :aria-expanded="open" aria-haspopup="dialog" @click="open = !open">
            <svg class="h-5 w-5 shrink-0 transition-transform duration-200" :class="open ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div class="mx-auto w-full max-w-content p-2">
        <!-- Controls (only when open) -->
        <div v-show="open" class="max-h-[calc(24rem-3.25rem)] overflow-y-auto">
          <div class="mb-4 border-b border-edge-subtle pb-4">
            <p class="mb-2 text-xs font-medium text-content-secondary">{{ t('nav.readingTheme') }}</p>
            <ColorSchemeSwatches variant="compact" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="sm:col-span-2 lg:col-span-1 flex items-end">
              <div
                class="flex w-full items-stretch gap-0 overflow-hidden rounded-lg border border-edge-subtle bg-surface-raised shadow-ds-card focus-within:ring-1 focus-within:ring-brand/30"
                role="group" :aria-label="t('viewer.font')">
                <button type="button"
                  class="flex shrink-0 items-center justify-center px-2.5 py-2 text-content-secondary transition hover:bg-surface-subtle hover:text-content"
                  :aria-label="t('viewer.fontPrev')" @click="cycleFont(-1)">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <select :id="id('font')" v-model="fontKey"
                  class="min-w-0 flex-1 cursor-pointer border-x border-edge-subtle bg-surface-raised px-2 py-2 text-center text-sm font-medium text-content-secondary focus:border-brand focus:outline-none focus:ring-0"
                  @change="onReaderPreferenceChange">
                  <option v-for="f in fontOptions" :key="f" :value="f"
                    :title="READER_FONT_DESC_I18N_KEYS[f] ? t(READER_FONT_DESC_I18N_KEYS[f]) : undefined">
                    {{ t(READER_FONT_I18N_KEYS[f]) }}
                  </option>
                </select>
                <button type="button"
                  class="flex shrink-0 items-center justify-center px-2.5 py-2 text-content-secondary transition hover:bg-surface-subtle hover:text-content"
                  :aria-label="t('viewer.fontNext')" @click="cycleFont(1)">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex flex-nowrap justify-between overflow-x-auto reader-settings-items [scrollbar-width:thin]">
              <div class="reader-settings-item">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.fontSize') }}</p>
                <div
                  class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.fontSize') + ' -'" @click="decFontSize">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.fontSize') + ' +'" @click="incFontSize">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="reader-settings-item">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.lineHeight') }}</p>
                <div
                  class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.lineHeight') + ' -'" @click="decLineHeight">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.lineHeight') + ' +'" @click="incLineHeight">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="reader-settings-item">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.letterSpacing') }}</p>
                <div
                  class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.letterSpacing') + ' -'" @click="decLetterSpacing">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <button type="button"
                    class="flex h-9 w-9 items-center justify-center text-content-secondary transition hover:bg-surface-subtle"
                    :aria-label="t('viewer.letterSpacing') + ' +'" @click="incLetterSpacing">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </Teleport>
</template>
