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
    <Transition name="reader-settings-slide">
      <aside
        v-if="open"
        id="reading-settings-panel"
        ref="panelEl"
        class="reader-settings"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="id('title')"
        @click.stop
      >
        <div class="reader-settings__inner">
          <div class="reader-settings__header">
            <h2
              :id="id('title')"
              class="reader-settings__title"
            >
              {{ t('nav.mobileSettings') }}
            </h2>
            <button
              type="button"
              class="reader-settings__close"
              :aria-label="t('viewer.closeReadingSettings')"
              @click="close"
            >
              <Icon
                icon="heroicons:x-mark"
                class="reader-settings__close-icon"
                aria-hidden="true"
              />
            </button>
          </div>

          <section class="reader-settings__theme">
            <p class="reader-settings__label">
              {{ t('nav.readingTheme') }}
            </p>
            <ColorSchemeSwatches variant="compact" />
          </section>

          <div class="reader-settings__grid">
            <section class="reader-settings__font-section">
              <p class="reader-settings__label">
                {{ t('viewer.font') }}
              </p>
              <div
                class="reader-settings__font-group"
                role="group"
                :aria-label="t('viewer.font')"
              >
                <button
                  type="button"
                  class="reader-settings__font-nav"
                  :aria-label="t('viewer.fontPrev')"
                  @click="cycleFont(-1)"
                >
                  <Icon
                    icon="heroicons:chevron-left"
                    class="reader-settings__font-nav-icon"
                    aria-hidden="true"
                  />
                </button>
                <select
                  :id="id('font')"
                  v-model="fontKey"
                  class="reader-settings__font-select"
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
                  class="reader-settings__font-nav"
                  :aria-label="t('viewer.fontNext')"
                  @click="cycleFont(1)"
                >
                  <Icon
                    icon="heroicons:chevron-right"
                    class="reader-settings__font-nav-icon"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </section>

            <div class="reader-settings__controls">
              <section class="reader-settings__control">
                <p class="reader-settings__label reader-settings__label--tight">{{ t('viewer.fontSize') }}</p>
                <div class="reader-settings__stepper">
                  <button
                    type="button"
                    class="reader-settings__step reader-settings__step--border"
                    :aria-label="`${t('viewer.fontSize')} -`"
                    @click="decFontSize"
                  >
                    <Icon
                      icon="heroicons:minus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    class="reader-settings__step"
                    :aria-label="`${t('viewer.fontSize')} +`"
                    @click="incFontSize"
                  >
                    <Icon
                      icon="heroicons:plus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </section>

              <section class="reader-settings__control">
                <p class="reader-settings__label reader-settings__label--tight">{{ t('viewer.lineHeight') }}</p>
                <div class="reader-settings__stepper">
                  <button
                    type="button"
                    class="reader-settings__step reader-settings__step--border"
                    :aria-label="`${t('viewer.lineHeight')} -`"
                    @click="decLineHeight"
                  >
                    <Icon
                      icon="heroicons:minus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    class="reader-settings__step"
                    :aria-label="`${t('viewer.lineHeight')} +`"
                    @click="incLineHeight"
                  >
                    <Icon
                      icon="heroicons:plus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </section>

              <section class="reader-settings__control">
                <p class="reader-settings__label reader-settings__label--tight">{{ t('viewer.letterSpacing') }}</p>
                <div class="reader-settings__stepper">
                  <button
                    type="button"
                    class="reader-settings__step reader-settings__step--border"
                    :aria-label="`${t('viewer.letterSpacing')} -`"
                    @click="decLetterSpacing"
                  >
                    <Icon
                      icon="heroicons:minus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    class="reader-settings__step"
                    :aria-label="`${t('viewer.letterSpacing')} +`"
                    @click="incLetterSpacing"
                  >
                    <Icon
                      icon="heroicons:plus"
                      class="reader-settings__step-icon"
                      aria-hidden="true"
                    />
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
