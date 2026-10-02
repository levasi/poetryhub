<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  page:       number
  totalPages: number
  loading?:   boolean
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

// Show at most 5 page buttons centered around current page
const visiblePages = computed(() => {
  const total = props.totalPages
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const cur = props.page
  const pages: (number | '...')[] = [1]

  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)

  return pages
})
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="pagination"
  >
    <button
      type="button"
      class="pagination__btn"
      :disabled="page === 1 || loading"
      :aria-label="t('pagination.previous')"
      @click="emit('update:page', page - 1)"
    >
      ←
    </button>

    <template
      v-for="p in visiblePages"
      :key="String(p)"
    >
      <span
        v-if="p === '...'"
        class="pagination__ellipsis"
      >…</span>
      <button
        v-else
        class="pagination__btn"
        :class="{ 'pagination__btn--active': p === page }"
        :disabled="loading"
        @click="emit('update:page', p as number)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="pagination__btn"
      :disabled="page === totalPages || loading"
      :aria-label="t('pagination.next')"
      @click="emit('update:page', page + 1)"
    >
      →
    </button>
  </nav>
</template>
