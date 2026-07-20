<script setup lang="ts">
import { Icon } from '@iconify/vue'
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

/** Shared with AppNav header + AppMobileTabBar toggles. */
const open = useState('reading-settings-open', () => false)

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

function close() {
  open.value = false
}

function id(suffix: string) {
  return `${props.idPrefix}-${suffix}`
}

const panelEl = ref<HTMLElement | null>(null)

watchEffect((onCleanup) => {
  if (!open.value) return
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }
  document.addEventListener('keydown', onEsc)
  onCleanup(() => document.removeEventListener('keydown', onEsc))
})

watchEffect((onCleanup) => {
  if (!open.value) return
  let remove: (() => void) | undefined
  const ready = nextTick(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (panelEl.value?.contains(target)) return
      if (target instanceof Element && target.closest('[data-reading-settings-toggle]')) return
      close()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    remove = () => document.removeEventListener('pointerdown', onPointerDown, true)
  })
  onCleanup(() => {
    ready.then(() => remove?.())
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <aside
        v-if="open"
        id="reading-settings-panel"
        ref="panelEl"
        class="fixed inset-x-0 z-[65] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-edge-subtle bg-surface-overlay shadow-2xl ring-1 ring-edge-subtle/60 max-md:bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:bottom-0 md:z-[211] md:max-h-[24rem] md:rounded-none md:pb-[env(safe-area-inset-bottom,0px)]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="id('title')"
        @click.stop
      >
        <div class="mx-auto w-full max-w-content px-5 pb-5 pt-3 md:p-4">
          <div class="mb-4 flex items-center justify-between gap-3 md:mb-3">
            <h2 :id="id('title')" class="font-serif text-lg font-semibold text-content">
              {{ t('nav.mobileSettings') }}
            </h2>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-content-muted transition hover:bg-surface-subtle hover:text-content"
              :aria-label="t('viewer.closeReadingSettings')"
              @click="close"
            >
              <Icon icon="heroicons:x-mark" class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <section class="mb-5 border-b border-edge-subtle pb-4 md:mb-4">
            <p class="mb-2 text-xs font-medium text-content-secondary">
              {{ t('nav.readingTheme') }}
            </p>
            <ColorSchemeSwatches variant="compact" />
          </section>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-3">
            <section class="sm:col-span-2 lg:col-span-1">
              <p class="mb-2 text-xs font-medium text-content-secondary">
                {{ t('viewer.font') }}
              </p>
              <div
                class="flex w-full items-stretch overflow-hidden rounded-lg border border-edge-subtle bg-surface-raised shadow-ds-card focus-within:ring-1 focus-within:ring-brand/30"
                role="group"
                :aria-label="t('viewer.font')"
              >
                <button
                  type="button"
                  class="flex shrink-0 items-center justify-center px-3 py-2.5 text-content-secondary transition hover:bg-surface-subtle hover:text-content md:px-2.5 md:py-2"
                  :aria-label="t('viewer.fontPrev')"
                  @click="cycleFont(-1)"
                >
                  <Icon icon="heroicons:chevron-left" class="h-5 w-5" aria-hidden="true" />
                </button>
                <select
                  :id="id('font')"
                  v-model="fontKey"
                  class="min-w-0 flex-1 cursor-pointer border-x border-edge-subtle bg-surface-raised px-2 py-2.5 text-center text-sm font-medium text-content focus:border-brand focus:outline-none focus:ring-0 md:py-2 md:text-content-secondary"
                  @change="onReaderPreferenceChange"
                >
                  <option
                    v-for="f in fontOptions"
                    :key="f"
                    :value="f"
                    :title="READER_FONT_DESC_I18N_KEYS[f] ? t(READER_FONT_DESC_I18N_KEYS[f]) : undefined"
                  >
                    {{ t(READER_FONT_I18N_KEYS[f]) }}
                  </option>
                </select>
                <button
                  type="button"
                  class="flex shrink-0 items-center justify-center px-3 py-2.5 text-content-secondary transition hover:bg-surface-subtle hover:text-content md:px-2.5 md:py-2"
                  :aria-label="t('viewer.fontNext')"
                  @click="cycleFont(1)"
                >
                  <Icon icon="heroicons:chevron-right" class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </section>

            <div class="flex flex-nowrap justify-between gap-4 overflow-x-auto sm:col-span-2 lg:col-span-2 [scrollbar-width:thin]">
              <section class="shrink-0">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.fontSize') }}</p>
                <div class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.fontSize')} -`"
                    @click="decFontSize"
                  >
                    <Icon icon="heroicons:minus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.fontSize')} +`"
                    @click="incFontSize"
                  >
                    <Icon icon="heroicons:plus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </section>

              <section class="shrink-0">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.lineHeight') }}</p>
                <div class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.lineHeight')} -`"
                    @click="decLineHeight"
                  >
                    <Icon icon="heroicons:minus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.lineHeight')} +`"
                    @click="incLineHeight"
                  >
                    <Icon icon="heroicons:plus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </section>

              <section class="shrink-0">
                <p class="mb-1 text-xs font-medium text-content-secondary">{{ t('viewer.letterSpacing') }}</p>
                <div class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.letterSpacing')} -`"
                    @click="decLetterSpacing"
                  >
                    <Icon icon="heroicons:minus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center text-content-secondary transition hover:bg-surface-subtle md:h-9 md:w-9"
                    :aria-label="`${t('viewer.letterSpacing')} +`"
                    @click="incLetterSpacing"
                  >
                    <Icon icon="heroicons:plus" class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
