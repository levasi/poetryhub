<script setup lang="ts">
import { displayNationality } from '~/utils/nationality'
import type { Poem } from '~/composables/usePoems'
import { authorAvatarUrl } from '~/utils/authorAvatar'
definePageMeta({
  layout: 'fullwidth',
})

const { t } = useI18n()
const { labelForTag } = useTagLabel()

const route = useRoute()
const router = useRouter()

const DB_NOTICE_DISMISSED_KEY = 'ph_home_db_notice_dismissed_v1'
const dbNoticeDismissed = ref(false)

onMounted(() => {
  try {
    dbNoticeDismissed.value = localStorage.getItem(DB_NOTICE_DISMISSED_KEY) === '1'
  } catch {
    // ignore
  }
})

function dismissDbNotice() {
  dbNoticeDismissed.value = true
  try {
    localStorage.setItem(DB_NOTICE_DISMISSED_KEY, '1')
  } catch {
    // ignore
  }
}

/** Home center column: show this author's poems when set (?author=slug). */
const authorSlug = computed(() => {
  const a = route.query.author
  if (typeof a === 'string' && a.trim()) return a.trim()
  if (Array.isArray(a) && a[0]) return String(a[0]).trim()
  return null
})

const authorFeedPage = ref(1)
/** When viewing ?author= — "works" (Lucrări) vs biography tab. */
const authorTab = ref<'works' | 'bio'>('works')
watch(authorSlug, () => {
  authorFeedPage.value = 1
  authorTab.value = 'works'
})

interface AuthorPagePayload {
  author: {
    id: string
    name: string
    slug: string
    imageUrl: string | null
    bio: string | null
    nationality: string | null
    birthYear: number | null
    deathYear: number | null
  }
  works: { title: string; slug: string }[]
  poems: {
    data: Poem[]
    meta: { page: number; limit: number; total: number; totalPages: number }
  }
}

type AuthorPageData = AuthorPagePayload | { readonly idle: true }

const { data: authorPage, pending: authorPending, error: authorError } = await useAsyncData(
  'home-author-feed',
  async (): Promise<AuthorPageData> => {
    const slug = authorSlug.value
    if (!slug) return { idle: true }
    return $fetch<AuthorPagePayload>(`/api/authors/${encodeURIComponent(slug)}`, {
      query: { limit: 12, page: authorFeedPage.value },
    })
  },
  { watch: [authorSlug, authorFeedPage] },
)

const authorPoemsForCards = computed((): Poem[] => {
  const page = authorPage.value
  if (!page || 'idle' in page || !page.author) return []
  const a = page.author
  const authorMini = {
    id: a.id,
    name: a.name,
    slug: a.slug,
    imageUrl: a.imageUrl,
    nationality: a.nationality ?? undefined,
    birthYear: a.birthYear ?? undefined,
    deathYear: a.deathYear ?? undefined,
  }
  return page.poems.data.map((p) => ({ ...p, author: authorMini }))
})

function clearHomeAuthor() {
  router.push({ path: '/descopera', query: {} })
}

function authorYearsLabel(a: AuthorPagePayload['author'] | null | undefined) {
  if (!a) return ''
  if (a.birthYear && a.deathYear) return t('authors.lifeSpan', { birth: a.birthYear, death: a.deathYear })
  if (a.birthYear) return t('authors.born', { year: a.birthYear })
  return ''
}

useSeoMeta({
  title: computed(() => t('seo.discoverTitle')),
  description: computed(() => t('seo.discoverDesc')),
})

interface HomeTagRow {
  id: string
  name: string
  slug: string
  category: string
  color: string | null
}

interface HomePayload {
  featured: Poem[]
  recent: Poem[]
  moodTags: HomeTagRow[]
  themeTags: HomeTagRow[]
}

const { data: home, pending: homePending } = await useFetch<HomePayload>('/api/home')

/** Poems per “Pentru tine” page (initial load + each “Încarcă mai multe”). */
const FOR_YOU_PAGE_SIZE = 12

/** Same seed for the whole SPA session until full reload — avoids reshuffling “For you” on every revisit to `/`. */
const forYouSeed = useState<number>('home-for-you-seed', () => Date.now())

type ForYouApiMeta = { limit: number; total: number; exclude: number; hasMore: boolean }

const nuxtApp = useNuxtApp()
const { data: forYouRes, pending: forYouPending } = await useAsyncData(
  'home-for-you',
  () =>
    $fetch<{ data: Poem[]; meta: ForYouApiMeta }>('/api/home/for-you', {
      query: { limit: FOR_YOU_PAGE_SIZE, seed: forYouSeed.value },
    }),
  {
    /** Reuse Nitro payload when navigating back to home — no duplicate fetch + same poems. */
    getCachedData(key) {
      return nuxtApp.payload.data[key] ?? nuxtApp.static?.data[key]
    },
  },
)

/** Persist list + meta across route changes so the feed does not flash empty or re-randomize. */
const forYouPoems = useState<Poem[]>('home-for-you-poems', () => [])
const forYouMeta = useState<ForYouApiMeta>('home-for-you-meta', () => ({
  total: 0,
  limit: FOR_YOU_PAGE_SIZE,
  exclude: 0,
  hasMore: true,
}))
const forYouLoadingMore = ref(false)

watch(
  forYouRes,
  (v) => {
    if (!v?.data) return
    forYouMeta.value = v.meta
    // Don't wipe poems appended via “load more” when the cached first page re-emits.
    if (!forYouPoems.value.length) {
      forYouPoems.value = v.data
      return
    }
    if (forYouPoems.value.length > v.data.length) return
    forYouPoems.value = v.data
  },
  { immediate: true },
)

async function loadMoreForYou() {
  if (forYouLoadingMore.value) return
  if (!forYouMeta.value.hasMore) return
  forYouLoadingMore.value = true
  try {
    const exclude = forYouPoems.value.map((p) => p.id).join(',')
    const res = await $fetch<{ data: Poem[]; meta: { limit: number; total: number; exclude: number; hasMore: boolean } }>(
      '/api/home/for-you',
      { query: { limit: FOR_YOU_PAGE_SIZE, seed: Date.now(), exclude } },
    )
    const seen = new Set(forYouPoems.value.map((p) => p.id))
    for (const p of res.data) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        forYouPoems.value.push(p)
      }
    }
    forYouMeta.value = res.meta
  } finally {
    forYouLoadingMore.value = false
  }
}

const feedTab = ref<'foryou' | 'newest' | 'staff'>('foryou')

type PoemsListMeta = { page: number; limit: number; total: number; totalPages: number }

const newestPage = ref(1)
const newestPoems = useState<Poem[]>('discover-newest-poems', () => [])
const newestMeta = useState<PoemsListMeta>('discover-newest-meta', () => ({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1,
}))
const newestLoadingMore = ref(false)

const { data: newestRes, pending: newestPending } = await useAsyncData(
  'discover-newest',
  () =>
    $fetch<{ data: Poem[]; meta: PoemsListMeta }>('/api/poems', {
      query: { limit: 12, page: 1 },
    }),
  {
    getCachedData(key) {
      return nuxtApp.payload.data[key] ?? nuxtApp.static?.data[key]
    },
  },
)

watch(
  newestRes,
  (v) => {
    if (!v?.data) return
    newestPoems.value = v.data
    newestMeta.value = v.meta
    newestPage.value = v.meta.page
  },
  { immediate: true },
)

async function loadMoreNewest() {
  if (newestLoadingMore.value || newestPage.value >= newestMeta.value.totalPages) return
  newestLoadingMore.value = true
  try {
    const nextPage = newestPage.value + 1
    const res = await $fetch<{ data: Poem[]; meta: PoemsListMeta }>('/api/poems', {
      query: { limit: newestMeta.value.limit, page: nextPage },
    })
    const seen = new Set(newestPoems.value.map((p) => p.id))
    for (const p of res.data) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        newestPoems.value.push(p)
      }
    }
    newestMeta.value = res.meta
    newestPage.value = nextPage
  } finally {
    newestLoadingMore.value = false
  }
}

const canLoadMoreNewest = computed(
  () => newestPage.value < newestMeta.value.totalPages && !authorSlug.value && !tagSlug.value,
)

/** Tag filter from ?tag=slug (links from poem tags / TagBadge). */
const tagSlug = computed(() => {
  const tg = route.query.tag
  if (typeof tg === 'string' && tg.trim()) return tg.trim()
  if (Array.isArray(tg) && tg[0]) return String(tg[0]).trim()
  return null
})

const { data: tagFeed, pending: tagPending } = await useAsyncData(
  'home-tag-feed',
  async () => {
    const slug = tagSlug.value
    if (!slug) return { data: [] as Poem[], meta: { total: 0 } }
    return $fetch<{ data: Poem[]; meta: { total: number } }>('/api/poems', {
      query: { tag: slug, limit: 48 },
    })
  },
  { watch: [tagSlug] },
)

const tagPoems = computed(() => tagFeed.value?.data ?? [])

const activeTagLabel = computed(() => {
  const slug = tagSlug.value
  if (!slug) return ''
  const all = [...(home.value?.moodTags ?? []), ...(home.value?.themeTags ?? [])]
  const hit = all.find((row) => row.slug === slug)
  return hit ? labelForTag(hit.slug, hit.name) : slug
})

function clearTagFilter() {
  const q = { ...route.query }
  delete q.tag
  router.push({ path: '/descopera', query: q })
}

const canLoadMoreForYou = computed(() => forYouMeta.value.hasMore && !authorSlug.value && !tagSlug.value)

const featured = computed(() => home.value?.featured ?? [])
const recent = computed(() => home.value?.recent ?? [])
const staffPickPoems = computed(() => recent.value)

/** Default discover feed (no author/tag) — mobile uses full-screen reels. */
const isDefaultFeed = computed(() => !authorSlug.value && !tagSlug.value)
</script>

<template>
  <div class="discover-page">
    <!-- Mobile: TikTok / Reels-style poem feed -->
    <ClientOnly>
      <PoemReelsFeed
        v-if="isDefaultFeed"
        :poems="forYouPoems"
        :pending="forYouPending"
        :loading-more="forYouLoadingMore"
        :has-more="canLoadMoreForYou"
        @load-more="loadMoreForYou"
      />
    </ClientOnly>

    <div
      class="discover-page__desktop"
      :class="isDefaultFeed ? 'discover-page__desktop--default-feed' : ''"
    >
      <!-- Mobile / tablet author shelf -->
      <div v-if="!authorSlug" class="discover-page__shelf">
        <HomeAuthorsColumn variant="shelf" />
      </div>

      <div class="discover-page__layout">
        <!-- Left: authors (desktop rail) -->
        <aside class="discover-page__aside">
          <div class="discover-page__rail" :aria-label="t('home.leftRailAria')">
            <HomeAuthorsColumn variant="sidebar" />
          </div>
        </aside>
        <!-- Center feed -->
        <main class="discover-page__main">
          <div class="discover-page__feed">
            <!-- Tag filter active -->
            <template v-if="tagSlug && !authorSlug">
              <div class="ds-banner ds-banner-info discover-page__tag-banner">
                <span class="discover-page__tag-label">
                  {{ t('home.filterByTag') }}:
                </span>
                <TagBadge :name="activeTagLabel" :slug="tagSlug" :active="true" :link="false" />
                <button type="button" class="discover-page__tag-clear"
                  @click="clearTagFilter">
                  {{ t('home.clearTagFilter') }}
                </button>
              </div>

              <div v-if="tagPending" class="discover-page__skeleton">
                <DsSkeleton v-for="n in 4" :key="n" :lines="4" />
              </div>

              <template v-else-if="tagPoems.length">
                <div class="home-poem-masonry" role="list">
                  <div v-for="poem in tagPoems" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                    <PoetryCard :poem="poem" layout="masonry" :quick-read-list="tagPoems" />
                  </div>
                </div>
              </template>

              <DsEmpty v-else :title="t('poems.noPoems')" :description="t('home.clearTagFilter')">
                <button type="button" class="ds-btn-secondary" @click="clearTagFilter">
                  {{ t('home.clearTagFilter') }}
                </button>
              </DsEmpty>
            </template>

            <!-- Author poems (from left column selection) -->
            <template v-else-if="authorSlug">
              <div v-if="authorPending" class="discover-page__loading">
                <span class="ph-spinner ph-spinner--lg" aria-hidden="true" />
              </div>

              <div v-else-if="authorError" class="discover-page__error">
                <p>{{ t('authors.notFound') }}</p>
                <button type="button" class="discover-page__back-link"
                  @click="clearHomeAuthor">
                  {{ t('home.backToFeed') }}
                </button>
              </div>

              <template v-else-if="authorPage && !('idle' in authorPage)">
                <button type="button" class="discover-page__back-btn" @click="clearHomeAuthor">
                  <svg class="discover-page__back-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {{ t('home.backToFeed') }}
                </button>

                <div class="discover-page__author-head">
                  <img :src="authorAvatarUrl(authorPage.author)" :alt="authorPage.author.name" width="80" height="80"
                    loading="lazy" class="discover-page__author-avatar">
                  <div class="discover-page__author-meta">
                    <h2 class="discover-page__author-name">
                      {{ authorPage.author.name }}
                    </h2>
                    <p class="discover-page__author-sub">
                      <span v-if="displayNationality(authorPage.author.nationality)">{{
                        displayNationality(authorPage.author.nationality)
                      }}</span>
                      <span
                        v-if="displayNationality(authorPage.author.nationality) && authorYearsLabel(authorPage.author)">
                        · </span>
                      <span>{{ authorYearsLabel(authorPage.author) }}</span>
                    </p>
                    <p class="discover-page__author-count">
                      {{ t('authors.poemCount', authorPage.poems.meta.total) }}
                    </p>
                    <NuxtLink :to="`/authors/${authorPage.author.slug}`"
                      class="discover-page__author-profile">
                      {{ t('home.viewFullProfile') }}
                    </NuxtLink>
                  </div>
                </div>

                <div class="discover-page__sticky-tabs">
                  <div class="discover-page__tablist" role="tablist" :aria-label="t('home.authorTabsAria')">
                    <button type="button" role="tab" :aria-selected="authorTab === 'works'"
                      class="discover-page__tab"
                      :class="authorTab === 'works' ? 'discover-page__tab--active' : ''"
                      @click="authorTab = 'works'">
                      {{ t('home.authorTabWorks') }}
                    </button>
                    <button type="button" role="tab" :aria-selected="authorTab === 'bio'"
                      class="discover-page__tab"
                      :class="authorTab === 'bio' ? 'discover-page__tab--active' : ''"
                      @click="authorTab = 'bio'">
                      {{ t('authors.biography') }}
                    </button>
                  </div>
                </div>

                <!-- Lucrări / Works: poem grid -->
                <div v-show="authorTab === 'works'" role="tabpanel">
                  <div v-if="authorPoemsForCards.length" class="home-poem-masonry" role="list">
                    <div v-for="poem in authorPoemsForCards" :key="poem.id" class="home-poem-masonry-wrap"
                      role="listitem">
                      <PoetryCard :poem="poem" layout="masonry" :quick-read-list="authorPoemsForCards" />
                    </div>
                  </div>
                  <p v-else class="discover-page__empty-poems">
                    {{ t('authors.noPoemsYet') }}
                  </p>

                  <div v-if="(authorPage.poems.meta.totalPages ?? 1) > 1" class="discover-page__pagination">
                    <PaginationNav :page="authorFeedPage" :total-pages="authorPage.poems.meta.totalPages"
                      @update:page="(p) => { authorFeedPage = p }" />
                  </div>
                </div>

                <!-- Biography -->
                <div v-show="authorTab === 'bio'" role="tabpanel">
                  <section class="discover-page__bio">
                    <p v-if="authorPage.author.bio" class="discover-page__bio-text">
                      {{ authorPage.author.bio }}
                    </p>
                    <p v-else class="discover-page__bio-text discover-page__bio-text--empty">{{ t('authors.bioUnavailable') }}</p>
                  </section>
                </div>
              </template>
            </template>

            <!-- Default feed: For you / Staff picks -->
            <template v-else>
              <Alert v-if="!dbNoticeDismissed" variant="info" class="discover-page__notice">
                <template #icon>
                  <svg class="discover-page__notice-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </template>
                <AlertDescription>
                  {{ t('home.dbNotice') }}
                </AlertDescription>
              </Alert>

              <div class="discover-page__sticky-tabs discover-page__sticky-tabs--feed">
                <DsTabs :label="t('home.feedTabsAria')" class="discover-page__feed-tabs">
                  <DsTab :active="feedTab === 'foryou'" @click="feedTab = 'foryou'">
                    {{ t('home.tabForYou') }}
                  </DsTab>
                  <DsTab :active="feedTab === 'newest'" @click="feedTab = 'newest'">
                    {{ t('home.tabNewest') }}
                  </DsTab>
                  <DsTab :active="feedTab === 'staff'" @click="feedTab = 'staff'">
                    {{ t('home.tabStaffPicks') }}
                  </DsTab>
                </DsTabs>
              </div>

              <div v-if="homePending" class="discover-page__skeleton">
                <DsSkeleton v-for="n in 4" :key="n" :lines="4" />
              </div>

              <template v-else>
                <!-- For you -->
                <div v-show="feedTab === 'foryou'">
                  <div v-if="forYouPending && !forYouPoems.length" class="discover-page__skeleton">
                    <DsSkeleton v-for="n in 4" :key="n" :lines="4" />
                  </div>

                  <DsEmpty v-else-if="!forYouPoems.length" :title="t('home.emptyLibrary')" />

                  <template v-else>
                    <div class="home-poem-masonry home-poem-masonry--cols-3" role="list">
                      <div v-for="poem in forYouPoems" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                        <PoetryCard :poem="poem" layout="masonry" :quick-read-list="forYouPoems" />
                      </div>
                    </div>
                    <div v-if="canLoadMoreForYou" class="discover-page__load-more">
                      <button type="button" class="discover-page__load-btn"
                        :disabled="forYouLoadingMore" :aria-busy="forYouLoadingMore" @click="loadMoreForYou">
                        <span v-if="forYouLoadingMore" class="ph-spinner" aria-hidden="true" />
                        {{ forYouLoadingMore ? t('home.loadingMore') : t('home.loadMoreForYou') }}
                      </button>
                    </div>
                  </template>
                </div>

                <!-- Newest (by published date) -->
                <div v-show="feedTab === 'newest'" role="tabpanel">
                  <div v-if="newestPending && !newestPoems.length" class="discover-page__skeleton">
                    <DsSkeleton v-for="n in 4" :key="n" :lines="4" />
                  </div>

                  <DsEmpty v-else-if="!newestPoems.length" :title="t('home.emptyLibrary')" />

                  <template v-else>
                    <div class="home-poem-masonry home-poem-masonry--cols-3" role="list">
                      <div v-for="poem in newestPoems" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                        <PoetryCard :poem="poem" layout="masonry" :quick-read-list="newestPoems" />
                      </div>
                    </div>
                    <div v-if="canLoadMoreNewest" class="discover-page__load-more">
                      <button
                        type="button"
                        class="discover-page__load-btn"
                        :disabled="newestLoadingMore"
                        :aria-busy="newestLoadingMore"
                        @click="loadMoreNewest"
                      >
                        <span v-if="newestLoadingMore" class="ph-spinner" aria-hidden="true" />
                        {{ newestLoadingMore ? t('home.loadingMore') : t('home.loadMoreForYou') }}
                      </button>
                    </div>
                  </template>
                </div>

                <!-- Staff picks (recent) -->
                <div v-show="feedTab === 'staff'" role="tabpanel">
                  <DsEmpty v-if="!staffPickPoems.length" :title="t('home.emptyLibrary')" />
                  <div v-else class="home-poem-masonry home-poem-masonry--cols-3" role="list">
                    <div v-for="poem in staffPickPoems" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                      <PoetryCard :poem="poem" layout="masonry" :quick-read-list="staffPickPoems" />
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </main>
      </div>

      <section
        v-if="!authorSlug && !tagSlug && !featured.length && !recent.length && !homePending && !forYouPoems.length"
        class="discover-page__empty-hint">
        <p>
          {{ t('home.emptyHintBefore') }}
          <NuxtLink to="/admin" class="discover-page__empty-link">
            {{ t('home.emptyHintLink') }}
          </NuxtLink>
          {{ t('home.emptyHintAfter') }}
        </p>
      </section>
    </div>
  </div>
</template>
