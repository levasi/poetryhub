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
  <div class="write-search-actions" role="group" :aria-label="t('write.diacriticsAria')">
    <button
      v-for="ch in RO_DIACRITICS"
      :key="ch"
      type="button"
      class="write-search-actions__diacritic"
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
    class="write-search-actions__submit"
    :disabled="loading || !canSearch"
    @click="emit('search')"
  >
    <Icon icon="heroicons:magnifying-glass" class="write-search-actions__submit-icon" aria-hidden="true" />
    {{ t('write.searchBtn') }}
  </button>
</template>
