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
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1">
    <!-- Prev -->
    <button
      type="button"
      class="rounded-lg border border-edge bg-surface-raised px-3 py-1.5 text-sm text-content-secondary shadow-sm transition-colors hover:border-edge-strong hover:text-content disabled:opacity-30"
      :disabled="page === 1 || loading"
      :aria-label="t('pagination.previous')"
      @click="emit('update:page', page - 1)"
    >
      ←
    </button>

    <!-- Page numbers -->
    <template v-for="p in visiblePages" :key="String(p)">
      <span v-if="p === '...'" class="px-2 text-content-soft">…</span>
      <button
        v-else
        class="rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-colors"
        :class="p === page
          ? 'border-brand/50 bg-brand-soft/25 text-content'
          : 'border-edge bg-surface-raised text-content-secondary hover:border-edge-strong hover:text-content'"
        :disabled="loading"
        @click="emit('update:page', p as number)"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next -->
    <button
      type="button"
      class="rounded-lg border border-edge bg-surface-raised px-3 py-1.5 text-sm text-content-secondary shadow-sm transition-colors hover:border-edge-strong hover:text-content disabled:opacity-30"
      :disabled="page === totalPages || loading"
      :aria-label="t('pagination.next')"
      @click="emit('update:page', page + 1)"
    >
      →
    </button>
  </nav>
</template>
