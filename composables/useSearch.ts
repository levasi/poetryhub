// Full-text search composable — debounced, reactive
import type { Poem } from '~/composables/usePoems'

export function useSearch() {
  const { t } = useI18n()
  const query    = ref('')
  const results  = ref<Poem[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)
  const searched = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function search(q?: string) {
    const term = (q ?? query.value).trim()
    if (!term) { results.value = []; searched.value = false; return }

    loading.value = true
    error.value   = null

    try {
      const res = await $fetch<{ data: Poem[] }>('/api/poems', {
        params: { search: term, limit: 30, page: 1 },
      })
      results.value = res.data
      searched.value = true
    } catch (err: unknown) {
      error.value = (err as Error).message ?? t('search.error')
    } finally {
      loading.value = false
    }
  }

  // Auto-search with 350ms debounce when `query` changes
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!val.trim()) { results.value = []; searched.value = false; return }
    debounceTimer = setTimeout(() => search(val), 350)
  })

  function clear() {
    query.value   = ''
    results.value = []
    searched.value = false
  }

  return { query, results, loading, error, searched, search, clear }
}
