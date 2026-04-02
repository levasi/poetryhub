<script setup lang="ts">
import { COLOR_SCHEMES, type ColorSchemeId, useColorScheme } from '~/composables/useColorScheme'

const { t } = useI18n()
const { scheme, applyScheme, hydrate } = useColorScheme()

onMounted(() => {
  hydrate()
})

const labels: Record<ColorSchemeId, string> = {
  paper: 'colorScheme.paper',
  ink: 'colorScheme.ink',
  sepia: 'colorScheme.sepia',
  qi: 'colorScheme.qi',
}
</script>

<template>
  <div
    class="inline-flex max-w-full flex-wrap justify-center gap-0.5 rounded-ds-md border border-edge-subtle bg-surface-raised p-0.5 shadow-sm"
    role="group"
    :aria-label="t('colorScheme.aria')"
  >
    <button
      v-for="id in COLOR_SCHEMES"
      :key="id"
      type="button"
      class="rounded-ds-sm px-2.5 py-1.5 text-ui-xs font-medium transition-colors md:px-3"
      :class="
        scheme === id
          ? 'bg-brand-soft/35 text-content shadow-sm'
          : 'text-content-muted hover:bg-surface-subtle hover:text-content'
      "
      :aria-pressed="scheme === id"
      @click="applyScheme(id)"
    >
      {{ t(labels[id]) }}
    </button>
  </div>
</template>
