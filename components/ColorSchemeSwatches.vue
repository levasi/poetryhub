<script setup lang="ts">
import { COLOR_SCHEMES, type ColorSchemeId } from '~/utils/colorScheme'
import { useColorScheme } from '~/composables/useColorScheme'

const props = withDefaults(
  defineProps<{
    /** `labels` — text buttons; `swatches` — paper previews; `compact` — small circles. */
    variant?: 'labels' | 'swatches' | 'compact'
  }>(),
  { variant: 'labels' },
)

const { t } = useI18n()
const { scheme, applyScheme } = useColorScheme()

const labels: Record<ColorSchemeId, string> = {
  paper: 'colorScheme.paper',
  ink: 'colorScheme.ink',
  sepia: 'colorScheme.sepia',
  qi: 'colorScheme.qi',
  historic: 'colorScheme.historic',
  parchment: 'colorScheme.parchment',
}

/** Mini preview colors for swatch buttons (not theme-dependent). */
const previews: Record<ColorSchemeId, { bg: string, text: string }> = {
  paper: { bg: '#fafaf8', text: '#0f0f0a' },
  ink: { bg: '#0e0e0c', text: '#f8f6f0' },
  sepia: { bg: '#f4ecda', text: '#30281e' },
  qi: { bg: '#f8f5ed', text: '#201c18' },
  historic: { bg: '#0a0e14', text: '#f5f2e8' },
  parchment: { bg: '#f4eee0', text: '#372a22' },
}

function swatchLabel(id: ColorSchemeId) {
  return t(labels[id])
}

const rootClass = computed(() => {
  switch (props.variant) {
    case 'compact':
      return 'color-scheme color-scheme--compact'
    case 'swatches':
      return 'color-scheme color-scheme--swatches'
    default:
      return 'color-scheme color-scheme--labels'
  }
})
</script>

<template>
  <div
    role="group"
    :aria-label="t('colorScheme.aria')"
    :class="rootClass"
  >
    <button
      v-for="id in COLOR_SCHEMES"
      :key="id"
      type="button"
      :aria-pressed="scheme === id"
      :aria-label="swatchLabel(id)"
      :title="swatchLabel(id)"
      class="color-scheme__btn"
      :class="{ 'color-scheme__btn--active': scheme === id }"
      @click="applyScheme(id)"
    >
      <template v-if="variant === 'swatches'">
        <span
          class="color-scheme__preview"
          :style="{ backgroundColor: previews[id].bg, color: previews[id].text }"
        >
          Aa
        </span>
        <span class="color-scheme__label">{{ swatchLabel(id) }}</span>
        <span
          v-if="scheme === id"
          class="color-scheme__check"
          aria-hidden="true"
        >✦</span>
      </template>
      <span
        v-else-if="variant === 'compact'"
        class="color-scheme__dot"
        :style="{ backgroundColor: previews[id].bg, boxShadow: `inset 0 0 0 1px ${previews[id].text}22` }"
      />
      <template v-else>
        {{ swatchLabel(id) }}
      </template>
    </button>
  </div>
</template>
