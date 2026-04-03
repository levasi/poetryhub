// Composable for fetching and paginating poems
import { isReactive, reactive, type Reactive } from 'vue'

export interface PoemNavigationNeighbor {
  slug:  string
  title: string
}

/** Per-poem carousel JSON from `Poem.carouselFontSettings` (see `utils/poemCarouselFontSettings.ts`). */
export interface PoemCarouselFontSettings {
  theme?: string
  carouselFontKey: string
  carouselFontFamily?: string
  linesPerSlide: number
  bodyFontSizeScale: number
  bodyLineHeight: number
  ctaText?: string
  keywordInput?: string
}

export interface Poem {
  id:          string
  title:       string
  slug:        string
  content:     string
  /** Instagram carousel generator typography; null/absent means use site defaults. */
  carouselFontSettings?: PoemCarouselFontSettings | null
  excerpt:     string | null
  authorId:    string
  language:    string
  source:      string
  sourceUrl:   string | null
  readingTime: number | null
  writtenYear: number | null
  writtenPeriod: string | null
  featured:    boolean
  publishedAt: string
  createdAt:   string
  /** Set when a registered user submitted the poem; used for edit permissions. */
  submittedByUserId?: string | null
  author:      {
    id: string
    name: string
    slug: string
    imageUrl?: string | null
    nationality?: string | null
    birthYear?: number | null
    deathYear?: number | null
  }
  poemTags:    Array<{ tag: { id: string; name: string; slug: string; category: string; color: string | null } }>
  navigation?: {
    newer: PoemNavigationNeighbor | null
    older: PoemNavigationNeighbor | null
  }
}

export interface PoemListResponse {
  data: Poem[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface PoemFilters {
  page?:     number
  limit?:    number
  author?:   string
  tag?:      string
  source?:   string
  featured?: boolean
  search?:   string
}

export function usePoems(initialFilters: PoemFilters = {}) {
  // Reuse reactive filter state from callers (e.g. useFilters) so updates stay in sync.
  const filters = isReactive(initialFilters)
    ? (initialFilters as Reactive<PoemFilters>)
    : reactive<PoemFilters>({ page: 1, limit: 12, ...initialFilters })
  if (filters.limit == null) filters.limit = 12
  if (filters.page == null) filters.page = 1
  const loading  = ref(false)
  const error    = ref<string | null>(null)
  const response = ref<PoemListResponse | null>(null)

  const poems      = computed(() => response.value?.data ?? [])
  const meta       = computed(() => response.value?.meta)
  const totalPages = computed(() => meta.value?.totalPages ?? 1)

  async function fetch(newFilters?: Partial<PoemFilters>) {
    if (newFilters) Object.assign(filters, newFilters)
    loading.value = true
    error.value   = null

    try {
      // Build query string from filters, omitting empty values
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null),
      ) as Record<string, string>

      response.value = await $fetch<PoemListResponse>('/api/poems', { params })
    } catch (err: unknown) {
      error.value = (err as Error).message ?? 'Failed to load poems'
    } finally {
      loading.value = false
    }
  }

  function nextPage() {
    if (meta.value && filters.page! < totalPages.value) {
      fetch({ page: filters.page! + 1 })
    }
  }

  function prevPage() {
    if (filters.page! > 1) fetch({ page: filters.page! - 1 })
  }

  function goToPage(page: number) {
    fetch({ page })
  }

  return { filters, poems, meta, totalPages, loading, error, fetch, nextPage, prevPage, goToPage }
}

// Fetch a single poem by slug
export function usePoem(slug: string) {
  return useFetch<Poem>(`/api/poems/${slug}`)
}

// Fetch the daily poem
export function useDailyPoem() {
  return useFetch<Poem>('/api/poems/daily')
}

/** Random poem; pass `authorSlug` to restrict to that author. */
export async function fetchRandomPoem(authorSlug?: string): Promise<Poem> {
  const params = authorSlug ? { author: authorSlug } : {}
  return $fetch<Poem>('/api/poems/random', { params })
}

export interface RandomAuthor {
  id:           string
  name:         string
  slug:         string
  imageUrl:     string | null
  bio:          string | null
  birthYear:    number | null
  deathYear:    number | null
  nationality:  string | null
  _count?:      { poems: number }
  /** Poem titles in this collection (same shape as GET /api/authors/:slug). */
  works:        Array<{ title: string; slug: string }>
}

export async function fetchRandomAuthor(): Promise<RandomAuthor> {
  return $fetch<RandomAuthor>('/api/authors/random')
}
