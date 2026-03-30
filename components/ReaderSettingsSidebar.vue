<script setup lang="ts">
import {
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
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open"
        ref="panelEl"
        class="fixed inset-y-0 right-0 z-[210] flex w-full max-w-md flex-col border-l border-ink-200 bg-white shadow-2xl ring-1 ring-ink-200/40"
        role="dialog"
        aria-modal="false"
        :aria-labelledby="id('title')"
        @click.stop
      >
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <p :id="id('title')" class="text-xs font-semibold uppercase tracking-widest text-ink-500">
              {{ t('viewer.readingDisplay') }}
            </p>
            <p class="mt-1 text-sm text-ink-600">{{ t('viewer.readingSettingsHint') }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
            :aria-label="t('viewer.closeReadingSettings')"
            @click="open = false"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div class="space-y-5">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600" :for="id('font')">{{ t('viewer.font') }}</label>
              <div
                class="flex w-full items-stretch gap-0 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm focus-within:ring-1 focus-within:ring-gold-400/40"
                role="group"
                :aria-label="t('viewer.font')"
              >
                <button
                  type="button"
                  class="flex shrink-0 items-center justify-center px-2.5 py-2 text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                  :aria-label="t('viewer.fontPrev')"
                  @click="cycleFont(-1)"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <select
                  :id="id('font')"
                  v-model="fontKey"
                  class="min-w-0 flex-1 cursor-pointer border-x border-ink-100 bg-white px-2 py-2 text-center text-sm font-medium text-ink-800 focus:border-gold-400 focus:outline-none focus:ring-0"
                  @change="onReaderPreferenceChange"
                >
                  <option v-for="f in fontOptions" :key="f" :value="f">
                    {{ t(READER_FONT_I18N_KEYS[f]) }}
                  </option>
                </select>
                <button
                  type="button"
                  class="flex shrink-0 items-center justify-center px-2.5 py-2 text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                  :aria-label="t('viewer.fontNext')"
                  @click="cycleFont(1)"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600" :for="id('size')">
                {{ t('viewer.fontSize') }}
                <span class="tabular-nums text-ink-500">({{ fontSizePx }}px)</span>
              </label>
              <input
                :id="id('size')"
                v-model.number="fontSizePx"
                type="range"
                min="16"
                max="48"
                step="1"
                class="h-2 w-full cursor-pointer accent-gold-600"
                @input="onReaderPreferenceChange"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600" :for="id('lineheight')">
                {{ t('viewer.lineHeight') }}
                <span class="tabular-nums text-ink-500">({{ lineHeight.toFixed(2) }})</span>
              </label>
              <input
                :id="id('lineheight')"
                v-model.number="lineHeight"
                type="range"
                :min="READER_LINE_HEIGHT_MIN"
                :max="READER_LINE_HEIGHT_MAX"
                :step="READER_LINE_HEIGHT_STEP"
                class="h-2 w-full cursor-pointer accent-gold-600"
                @input="onReaderPreferenceChange"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600" :for="id('letterspacing')">
                {{ t('viewer.letterSpacing') }}
                <span class="tabular-nums text-ink-500">({{ letterSpacingEm.toFixed(3) }}em)</span>
              </label>
              <input
                :id="id('letterspacing')"
                v-model.number="letterSpacingEm"
                type="range"
                :min="READER_LETTER_SPACING_MIN"
                :max="READER_LETTER_SPACING_MAX"
                :step="READER_LETTER_SPACING_STEP"
                class="h-2 w-full cursor-pointer accent-gold-600"
                @input="onReaderPreferenceChange"
              />
            </div>
          </div>

          <p class="mt-6 text-xs text-ink-500">
            {{ isLoggedIn ? t('viewer.prefsSavedHint') : t('viewer.prefsLocalHint') }}
          </p>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
