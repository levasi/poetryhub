<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RO_DIACRITICS } from '~/utils/writeSearch'

defineProps<{
  canSearch: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  search: []
  insertDiacritic: [char: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mt-2 flex flex-wrap items-center gap-1.5" role="group" :aria-label="t('write.diacriticsAria')">
    <button
      v-for="ch in RO_DIACRITICS"
      :key="ch"
      type="button"
      class="inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-2.5 py-1 text-base font-medium text-content transition hover:border-edge hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
      :title="t('write.insertDiacritic', { char: ch })"
      :aria-label="t('write.insertDiacritic', { char: ch })"
      data-testid="diacritic-btn"
      @mousedown.prevent
      @click="emit('insertDiacritic', ch)"
    >
      {{ ch }}
    </button>
  </div>
  <button
    type="button"
    data-testid="write-search-btn"
    class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
    :disabled="loading || !canSearch"
    @click="emit('search')"
  >
    <Icon icon="heroicons:magnifying-glass" class="h-5 w-5 shrink-0" aria-hidden="true" />
    {{ t('write.searchBtn') }}
  </button>
</template>
