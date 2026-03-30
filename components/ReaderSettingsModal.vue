<script setup lang="ts">
import { READER_FONT_I18N_KEYS } from '~/composables/useReaderPreferences'

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
  onReaderPreferenceChange,
  cycleFont,
  fontOptions,
} = useReaderPreferences()

function id(suffix: string) {
  return `${props.idPrefix}-${suffix}`
}

watchEffect((onCleanup) => {
  if (!open.value) return
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') open.value = false
  }
  document.addEventListener('keydown', onEsc)
  onCleanup(() => document.removeEventListener('keydown', onEsc))
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-ink-900/35 p-4 backdrop-blur-sm sm:p-6"
        role="presentation"
        @click.self="open = false"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="id('title')"
          class="relative z-10 w-full max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl ring-1 ring-ink-200/60"
          @click.stop
        >
          <div class="mb-4 flex items-start justify-between gap-3">
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
          </div>

          <p class="mt-4 text-xs text-ink-500">
            {{ isLoggedIn ? t('viewer.prefsSavedHint') : t('viewer.prefsLocalHint') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
