<script setup lang="ts">
import { displayNationality } from '~/utils/nationality'
import type { Poem } from '~/composables/usePoems'
import { authorAvatarUrl } from '~/utils/authorAvatar'

definePageMeta({
  layout: 'fullwidth',
})

const { t, locale } = useI18n()
const readerSettingsOpen = ref(false)

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

const { data: authorPage, pending: authorPending, error: authorError } = await useAsyncData(
  'home-author-feed',
  async () => {
    const slug = authorSlug.value
    if (!slug) return null
    return $fetch<AuthorPagePayload>(`/api/authors/${encodeURIComponent(slug)}`, {
      query: { limit: 12, page: authorFeedPage.value },
    })
  },
  { watch: [authorSlug, authorFeedPage] },
)

const authorPoemsForCards = computed((): Poem[] => {
  const page = authorPage.value
  if (!page?.author) return []
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
  router.push({ path: '/', query: {} })
}

function authorYearsLabel(a: AuthorPagePayload['author'] | null | undefined) {
  if (!a) return ''
  if (a.birthYear && a.deathYear) return t('authors.lifeSpan', { birth: a.birthYear, death: a.deathYear })
  if (a.birthYear) return t('authors.born', { year: a.birthYear })
  return ''
}

useSeoMeta({
  title: computed(() => t('seo.homeTitle')),
  description: computed(() => t('seo.homeDesc')),
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

/** Same seed for the whole SPA session until full reload — avoids reshuffling “For you” on every revisit to `/`. */
const forYouSeed = useState<number>('home-for-you-seed', () => Date.now())

type ForYouApiMeta = { limit: number; total: number; exclude: number; hasMore: boolean }

const nuxtApp = useNuxtApp()
const { data: forYouRes, pending: forYouPending } = await useAsyncData(
  'home-for-you',
  () =>
    $fetch<{ data: Poem[]; meta: ForYouApiMeta }>('/api/home/for-you', {
      query: { limit: 5, seed: forYouSeed.value },
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
  limit: 5,
  exclude: 0,
  hasMore: true,
}))
const forYouLoadingMore = ref(false)

watch(
  forYouRes,
  (v) => {
    if (!v?.data) return
    forYouPoems.value = v.data
    forYouMeta.value = v.meta
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
      { query: { limit: 5, seed: Date.now(), exclude } },
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

const feedTab = ref<'foryou' | 'featured'>('foryou')

const canLoadMoreForYou = computed(() => forYouMeta.value.hasMore && !authorSlug.value)

const featured = computed(() => home.value?.featured ?? [])
const recent = computed(() => home.value?.recent ?? [])

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(locale.value === 'ro' ? 'ro' : 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <button type="button"
      class="fixed right-3 top-1/2 z-[45] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-edge-subtle bg-surface-raised/95 text-content-muted shadow-ds-card backdrop-blur-sm transition hover:border-brand-soft hover:text-brand-hover md:right-6"
      :aria-label="t('viewer.openReadingSettings')" @click="readerSettingsOpen = true">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    <ReaderSettingsSidebar v-model:open="readerSettingsOpen" id-prefix="home" />

    <div class="w-full min-w-0 pb-20 pt-2 md:pt-4">
      <div
        class="grid grid-cols-1 gap-12 lg:gap-10 xl:grid-cols-[minmax(200px,260px)_minmax(0,1fr)_minmax(280px,380px)] xl:gap-12 2xl:gap-16">
        <!-- Left: authors -->
        <aside class="order-2 min-w-0 xl:order-1 xl:max-w-[320px]">
          <div class="sticky top-28 flex flex-col gap-10" :aria-label="t('home.leftRailAria')">
            <HomeAuthorsColumn />
          </div>
        </aside>
        <!-- Center feed -->
        <main class="order-1 min-w-0 xl:order-2 xl:min-w-0">
          <div class="mx-auto w-full max-w-none">
            <!-- Author poems (from left column selection) — profile above tabs; sticky Lucrări | Biografie -->
            <template v-if="authorSlug">
              <div v-if="authorPending" class="flex min-h-[16rem] items-center justify-center py-16">
                <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                  aria-hidden="true" />
              </div>

              <div v-else-if="authorError" class="py-16 text-center">
                <p class="text-content-muted">{{ t('authors.notFound') }}</p>
                <button type="button" class="mt-4 text-sm font-medium text-brand underline-offset-2 hover:underline"
                  @click="clearHomeAuthor">
                  {{ t('home.backToFeed') }}
                </button>
              </div>

              <template v-else-if="authorPage">
                <button type="button"
                  class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-content-secondary transition hover:text-content"
                  @click="clearHomeAuthor">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {{ t('home.backToFeed') }}
                </button>

                <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <img :src="authorAvatarUrl(authorPage.author)" :alt="authorPage.author.name" width="80" height="80"
                    loading="lazy" class="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-gold-300/60">
                  <div class="min-w-0">
                    <h2 class="font-serif text-2xl font-bold text-content sm:text-3xl">
                      {{ authorPage.author.name }}
                    </h2>
                    <p class="mt-1 text-sm text-content-secondary">
                      <span v-if="displayNationality(authorPage.author.nationality)">{{
                        displayNationality(authorPage.author.nationality)
                        }}</span>
                      <span
                        v-if="displayNationality(authorPage.author.nationality) && authorYearsLabel(authorPage.author)">
                        · </span>
                      <span>{{ authorYearsLabel(authorPage.author) }}</span>
                    </p>
                    <p class="mt-2 text-sm text-content-muted">
                      {{ t('authors.poemCount', authorPage.poems.meta.total) }}
                    </p>
                    <NuxtLink :to="`/authors/${authorPage.author.slug}`"
                      class="mt-2 inline-block text-sm font-medium text-brand transition hover:text-brand-hover">
                      {{ t('home.viewFullProfile') }}
                    </NuxtLink>
                  </div>
                </div>

                <div
                  class="sticky z-10 -mx-1 mb-8 flex flex-wrap items-end gap-4 border-b border-edge-subtle bg-surface-page/90 px-1 pb-0 pt-1 backdrop-blur-md top-[3.25rem] md:top-16">
                  <div class="flex gap-8" role="tablist" :aria-label="t('home.authorTabsAria')">
                    <button type="button" role="tab" :aria-selected="authorTab === 'works'"
                      class="relative pb-3 text-sm transition-colors" :class="authorTab === 'works'
                        ? 'font-medium text-content after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-content'
                        : 'text-content-muted hover:text-content-secondary'
                        " @click="authorTab = 'works'">
                      {{ t('home.authorTabWorks') }}
                    </button>
                    <button type="button" role="tab" :aria-selected="authorTab === 'bio'"
                      class="relative pb-3 text-sm transition-colors" :class="authorTab === 'bio'
                        ? 'font-medium text-content after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-content'
                        : 'text-content-muted hover:text-content-secondary'
                        " @click="authorTab = 'bio'">
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
                  <p v-else class="py-12 text-center text-content-muted">
                    {{ t('authors.noPoemsYet') }}
                  </p>

                  <div v-if="(authorPage.poems.meta.totalPages ?? 1) > 1" class="mt-10">
                    <PaginationNav :page="authorFeedPage" :total-pages="authorPage.poems.meta.totalPages"
                      @update:page="(p) => { authorFeedPage = p }" />
                  </div>
                </div>

                <!-- Biography -->
                <div v-show="authorTab === 'bio'" role="tabpanel">
                  <section class="pt-2">
                    <p v-if="authorPage.author.bio"
                      class="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-content-secondary">
                      {{ authorPage.author.bio }}
                    </p>
                    <p v-else class="max-w-3xl text-sm italic text-content-muted">{{ t('authors.bioUnavailable') }}</p>
                  </section>
                </div>
              </template>
            </template>

            <!-- Default feed: For you / Featured -->
            <template v-else>
              <div v-if="!dbNoticeDismissed"
                class="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-edge-subtle bg-surface-subtle/50 p-4 text-sm text-content-secondary">
                <p class="min-w-0">
                  {{ t('home.dbNotice') }}
                </p>
                <button type="button"
                  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-edge-subtle bg-surface-raised text-content-muted shadow-sm transition hover:border-edge hover:bg-surface-page hover:text-content"
                  aria-label="Închide" title="Închide" @click="dismissDbNotice">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <!-- Tabs (Medium-style) -->
              <div
                class="sticky z-10 -mx-1 mb-8 flex flex-wrap items-end gap-4 border-b border-edge-subtle bg-surface-page/90 px-1 pb-0 pt-1 backdrop-blur-md top-[3.25rem] md:top-16">
                <div class="flex gap-8" role="tablist" :aria-label="t('home.feedTabsAria')">
                  <button type="button" role="tab" :aria-selected="feedTab === 'foryou'"
                    class="relative pb-3 text-sm transition-colors" :class="feedTab === 'foryou'
                      ? 'font-medium text-content after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-content'
                      : 'text-content-muted hover:text-content-secondary'
                      " @click="feedTab = 'foryou'">
                    {{ t('home.tabForYou') }}
                  </button>
                  <button type="button" role="tab" :aria-selected="feedTab === 'featured'"
                    class="relative pb-3 text-sm transition-colors" :class="feedTab === 'featured'
                      ? 'font-medium text-content after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-content'
                      : 'text-content-muted hover:text-content-secondary'
                      " @click="feedTab = 'featured'">
                    {{ t('home.tabFeatured') }}
                  </button>
                </div>
              </div>

              <div v-if="homePending" class="flex min-h-[16rem] items-center justify-center py-16">
                <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                  aria-hidden="true" />
              </div>

              <template v-else>
                <!-- For you -->
                <div v-show="feedTab === 'foryou'">
                  <div v-if="forYouPending && !forYouPoems.length"
                    class="flex min-h-[16rem] items-center justify-center py-16">
                    <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                      aria-hidden="true" />
                  </div>

                  <template v-else-if="!forYouPoems.length">
                    <p class="py-16 text-center font-serif text-lg text-content-muted">
                      {{ t('home.emptyLibrary') }}
                    </p>
                  </template>

                  <template v-else>
                    <div class="home-poem-masonry" role="list">
                      <div v-for="poem in forYouPoems" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                        <PoetryCard :poem="poem" layout="masonry" :quick-read-list="forYouPoems" />
                      </div>
                    </div>
                    <div v-if="canLoadMoreForYou" class="mt-10 flex justify-center">
                      <button type="button"
                        class="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full border border-edge bg-surface-raised px-6 py-2.5 text-sm font-medium text-content-secondary transition hover:border-edge-strong hover:text-content disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="forYouLoadingMore" :aria-busy="forYouLoadingMore" @click="loadMoreForYou">
                        <span v-if="forYouLoadingMore"
                          class="h-4 w-4 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                          aria-hidden="true" />
                        {{ forYouLoadingMore ? t('home.loadingMore') : t('home.loadMoreForYou') }}
                      </button>
                    </div>
                  </template>
                </div>

                <!-- Featured -->
                <div v-show="feedTab === 'featured'" role="tabpanel">
                  <p v-if="!featured.length" class="py-12 text-center text-content-muted">
                    {{ t('home.featuredEmpty') }}
                  </p>
                  <div v-else class="home-poem-masonry" role="list">
                    <div v-for="poem in featured" :key="poem.id" class="home-poem-masonry-wrap" role="listitem">
                      <PoetryCard :poem="poem" layout="masonry" :quick-read-list="featured" />
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </main>

        <!-- Right rail: staff picks + topics -->
        <aside class="order-3 min-w-0 xl:max-w-[320px]">
          <div class="sticky top-28 flex flex-col gap-10">
            <div>
              <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-content">
                {{ t('home.staffPicksTitle') }}
              </h2>
              <div class="flex flex-col border-t border-edge-subtle">
                <template v-if="recent.length">
                  <NuxtLink
                    v-for="poem in recent.slice(0, 6)"
                    :key="poem.id"
                    :to="{ path: `/authors/${poem.author.slug}`, query: { poem: poem.slug } }"
                    class="group border-b border-edge-subtle py-4 first:pt-3"
                  >
                    <p
                      class="font-serif text-[15px] font-semibold leading-snug text-content group-hover:text-brand line-clamp-2">
                      {{ poem.title }}
                    </p>
                    <p class="mt-1.5 text-[13px] text-content-muted">
                      {{ poem.author.name }}
                    </p>
                  </NuxtLink>
                </template>
                <p v-else class="py-6 text-sm text-content-muted">
                  {{ t('home.emptyLibrary') }}
                </p>
              </div>
              <NuxtLink v-if="recent.length" to="/"
                class="mt-3 inline-block text-sm font-medium text-content-muted hover:text-brand">
                {{ t('home.allPoemsLink') }}
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>

      <section v-if="!authorSlug && !featured.length && !recent.length && !homePending && !forYouPoems.length"
        class="mx-auto max-w-content py-10 text-center text-sm text-content-soft">
        <p>
          {{ t('home.emptyHintBefore') }}
          <NuxtLink to="/admin"
            class="font-medium underline decoration-edge-strong underline-offset-2 hover:text-content">
            {{ t('home.emptyHintLink') }}
          </NuxtLink>
          {{ t('home.emptyHintAfter') }}
        </p>
      </section>
    </div>
  </div>
</template>
