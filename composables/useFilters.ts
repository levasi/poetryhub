// Filter state composable — syncs with URL query params
import type { PoemFilters } from '~/composables/usePoems'

export function useFilters() {
  const route  = useRoute()
  const router = useRouter()

  const filters = reactive<PoemFilters>({
    tag:      (route.query.tag      as string) || undefined,
    language: (route.query.language as string) || undefined,
    source:   (route.query.source   as string) || undefined,
    author:   (route.query.author   as string) || undefined,
    search:   (route.query.search as string) || undefined,
    page:     route.query.page ? parseInt(route.query.page as string) : 1,
  })

  // Push filter changes into the URL (for shareable links)
  function applyFilters(newFilters: Partial<PoemFilters>) {
    Object.assign(filters, { ...newFilters, page: 1 })
    const q: Record<string, string> = {}
    if (filters.tag)      q.tag      = filters.tag
    if (filters.language) q.language = filters.language
    if (filters.source)   q.source   = filters.source
    if (filters.author)   q.author   = filters.author
    if (filters.search)   q.search   = filters.search
    router.push({ query: q })
  }

  function clearFilters() {
    Object.assign(filters, { tag: undefined, language: undefined, source: undefined, author: undefined, search: undefined, page: 1 })
    router.push({ query: {} })
  }

  const hasActiveFilters = computed(
    () => !!(filters.tag || filters.language || filters.source || filters.author || filters.search),
  )

  return { filters, applyFilters, clearFilters, hasActiveFilters }
}
