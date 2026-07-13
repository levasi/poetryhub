<script setup lang="ts">
import { COLOR_SCHEMES, type ColorSchemeId, useColorScheme } from '~/composables/useColorScheme'

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
</script>

<template>
  <div
    role="group"
    :aria-label="t('colorScheme.aria')"
    :class="[
      variant === 'labels'
        ? 'inline-flex max-w-full flex-wrap justify-center gap-0.5 rounded-ds-md border border-edge-subtle bg-surface-raised p-2 shadow-sm'
        : variant === 'compact'
          ? 'flex flex-wrap gap-2'
          : 'grid grid-cols-3 gap-2 sm:grid-cols-6',
    ]"
  >
    <button
      v-for="id in COLOR_SCHEMES"
      :key="id"
      type="button"
      :aria-pressed="scheme === id"
      :aria-label="swatchLabel(id)"
      :title="swatchLabel(id)"
      :class="[
        variant === 'labels'
          ? [
            'rounded-ds-sm px-2.5 py-1.5 text-ui-xs font-medium transition-colors md:px-3',
            scheme === id
              ? 'bg-brand-tint text-content shadow-sm ring-1 ring-brand/35'
              : 'text-content-muted hover:bg-surface-subtle hover:text-content',
          ]
          : variant === 'compact'
            ? [
              'size-9 rounded-full border-2 transition',
              scheme === id ? 'border-brand ring-2 ring-brand/30' : 'border-edge-subtle hover:border-edge',
            ]
            : [
              'flex flex-col items-center gap-1.5 rounded-ds-md border p-2 text-center transition',
              scheme === id
                ? 'border-brand bg-brand-tint ring-1 ring-brand/35'
                : 'border-edge-subtle bg-surface-raised hover:border-edge',
            ],
      ]"
      @click="applyScheme(id)"
    >
      <template v-if="variant === 'swatches'">
        <span
          class="flex h-10 w-full items-center justify-center rounded-ds-sm border border-black/5 font-serif text-sm font-semibold"
          :style="{ backgroundColor: previews[id].bg, color: previews[id].text }"
        >
          Aa
        </span>
        <span class="text-ui-xs font-medium text-content-muted">{{ swatchLabel(id) }}</span>
        <span
          v-if="scheme === id"
          class="text-brand"
          aria-hidden="true"
        >✦</span>
      </template>
      <span
        v-else-if="variant === 'compact'"
        class="mx-auto block size-full rounded-full"
        :style="{ backgroundColor: previews[id].bg, boxShadow: `inset 0 0 0 1px ${previews[id].text}22` }"
      />
      <template v-else>
        {{ swatchLabel(id) }}
      </template>
    </button>
  </div>
</template>
