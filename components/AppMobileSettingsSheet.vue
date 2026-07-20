<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  READER_FONT_DESC_I18N_KEYS,
  READER_FONT_I18N_KEYS,
} from '~/composables/useReaderPreferences'

const { t } = useI18n()
const open = useState('mobile-settings-open', () => false)

const {
  fontKey,
  fontSizePx,
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

function close() {
  open.value = false
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
  const onPointerDown = (e: PointerEvent) => {
    const target = e.target
    if (!(target instanceof Node)) return
    if (panelEl.value?.contains(target)) return
    if (target instanceof Element && target.closest('[data-mobile-settings-toggle]')) return
    close()
  }
  // Defer so the opening tap does not immediately close the sheet
  let remove: (() => void) | undefined
  const ready = nextTick(() => {
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
        id="mobile-settings-sheet"
        ref="panelEl"
        class="fixed inset-x-0 z-[40] rounded-t-2xl border-t border-edge-subtle bg-surface-overlay md:hidden"
        style="bottom: calc(3.25rem + env(safe-area-inset-bottom, 0px));"
        role="dialog"
        aria-modal="true"
        :aria-label="t('nav.mobileSettings')"
        @click.stop
      >
        <div class="mx-auto max-h-[70vh] w-full max-w-lg overflow-y-auto px-5 pb-5 pt-3">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="font-serif text-lg font-semibold text-content">
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

          <section class="mb-5">
            <p class="mb-2 text-xs font-medium text-content-secondary">
              {{ t('nav.readingTheme') }}
            </p>
            <ColorSchemeSwatches variant="compact" />
          </section>

          <section class="mb-5">
            <p class="mb-2 text-xs font-medium text-content-secondary">
              {{ t('viewer.font') }}
            </p>
            <div
              class="flex w-full items-stretch overflow-hidden rounded-lg border border-edge-subtle bg-surface-raised shadow-ds-card"
              role="group"
              :aria-label="t('viewer.font')"
            >
              <button
                type="button"
                class="flex shrink-0 items-center justify-center px-3 py-2.5 text-content-secondary transition hover:bg-surface-subtle hover:text-content"
                :aria-label="t('viewer.fontPrev')"
                @click="cycleFont(-1)"
              >
                <Icon icon="heroicons:chevron-left" class="h-5 w-5" aria-hidden="true" />
              </button>
              <select
                id="mobile-settings-font"
                v-model="fontKey"
                class="min-w-0 flex-1 cursor-pointer border-x border-edge-subtle bg-surface-raised px-2 py-2.5 text-center text-sm font-medium text-content focus:outline-none"
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
                class="flex shrink-0 items-center justify-center px-3 py-2.5 text-content-secondary transition hover:bg-surface-subtle hover:text-content"
                :aria-label="t('viewer.fontNext')"
                @click="cycleFont(1)"
              >
                <Icon icon="heroicons:chevron-right" class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section>
            <p class="mb-2 text-xs font-medium text-content-secondary">
              {{ t('viewer.fontSize') }}
            </p>
            <div class="flex items-center gap-3">
              <div class="inline-flex overflow-hidden rounded-full border border-edge-subtle bg-surface-raised shadow-ds-card">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center border-r border-edge-subtle text-content-secondary transition hover:bg-surface-subtle"
                  :aria-label="`${t('viewer.fontSize')} -`"
                  @click="decFontSize"
                >
                  <Icon icon="heroicons:minus" class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center text-content-secondary transition hover:bg-surface-subtle"
                  :aria-label="`${t('viewer.fontSize')} +`"
                  @click="incFontSize"
                >
                  <Icon icon="heroicons:plus" class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <span class="tabular-nums text-sm text-content-muted">
                {{ fontSizePx }}px
              </span>
            </div>
          </section>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
