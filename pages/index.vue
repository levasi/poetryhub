<script setup lang="ts">
import { authorAvatarUrl } from '~/utils/authorAvatar'
import { useFavorites } from '~/composables/useFavorites'
import type { Poem } from '~/composables/usePoems'

const route = useRoute()
if (route.query.tag || route.query.author) {
  await navigateTo({ path: '/descopera', query: route.query }, { redirectCode: 301 })
}

const { t } = useI18n()
const { isLoggedIn } = useAuth()
const { favoriteIdOrder } = useFavorites()

useSeoMeta({
  title: computed(() => t('seo.homeTitle')),
  description: computed(() => t('seo.homeDesc')),
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/hero-banner.png',
      media: '(max-width: 1023px)',
    },
  ],
})

interface AuthorSpotlight {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  _count: { poems: number }
}

interface HomePayload {
  featured: Poem[]
  spotlightAuthors: AuthorSpotlight[]
}

const { data: home } = await useFetch<HomePayload>('/api/home')

const mostSavedPoems = computed(() => (home.value?.featured ?? []).slice(0, 3))
const spotlightAuthors = computed(() => home.value?.spotlightAuthors ?? [])

const favoriteIdsForHome = computed(() => favoriteIdOrder.value.slice(0, 2).join(','))

const { data: favoritesPayload } = await useFetch<{ data: Poem[] }>('/api/poems/by-ids', {
  query: computed(() => ({ ids: favoriteIdsForHome.value })),
  watch: [favoriteIdsForHome],
})

const homeFavorites = computed(() => {
  const list = favoritesPayload.value?.data ?? []
  const byId = new Map(list.map((p) => [p.id, p]))
  return favoriteIdOrder.value
    .slice(0, 2)
    .map((id) => byId.get(id))
    .filter((p): p is Poem => p != null)
})

const showFavoritesSection = computed(() => homeFavorites.value.length > 0)

const { query: searchQuery, results: searchResults, loading: searchLoading, error: searchError, searched, clear: clearSearch } = useSearch()
const showSearchResults = computed(() => searched.value || searchLoading.value)

const randomLoading = ref(false)

async function openRandomPoem() {
  if (randomLoading.value) return
  randomLoading.value = true
  try {
    const poem = await $fetch<Poem>('/api/poems/random')
    const authorSlug = poem.author?.slug
    if (authorSlug) {
      await navigateTo({ path: `/authors/${authorSlug}`, query: { poem: poem.slug } })
    } else {
      await navigateTo(`/poems/${poem.slug}`)
    }
  } catch {
    await navigateTo('/descopera')
  } finally {
    randomLoading.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in min-w-0">
    <!-- Hero -->
    <section class="relative -mx-4 overflow-hidden md:-mx-8 lg:mx-auto lg:max-w-content lg:overflow-visible lg:px-0">
      <div class="relative aspect-[4/3] w-full lg:aspect-auto lg:min-h-0 lg:static">
        <!-- Mobile: banner as atmospheric background -->
        <div
          class="pointer-events-none absolute inset-0 bg-[url('/hero-banner.png')] bg-cover bg-[center_35%] bg-no-repeat lg:hidden"
          role="img" :aria-label="t('home.heroBannerAlt')" />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-page/35 via-surface-page/20 to-surface-page/82 lg:hidden"
          aria-hidden="true" />

        <div
          class="relative flex h-full flex-col px-4 pb-5 md:px-8 md:pb-6 lg:grid lg:h-auto lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-center lg:gap-12 lg:px-0 lg:pb-0 lg:pt-10 xl:gap-16">
          <!-- Desktop copy column -->
          <div class="hidden text-left lg:block">
            <DsFleuron class="mb-6 lg:mx-0" />
            <h1 class="font-serif text-display-sm font-semibold tracking-tight text-content">
              <span class="block">{{ t('home.heroLine1') }}</span>
              <span class="mt-1 block text-brand">{{ t('home.heroLine2') }}</span>
            </h1>
            <p class="mt-5 max-w-reading text-base leading-relaxed text-content-secondary md:text-lg">
              {{ t('home.subtitle') }}
            </p>
            <div class="mt-8 flex flex-row items-center justify-start gap-3">
              <NuxtLink to="/descopera" class="ds-btn-primary min-w-[12rem] justify-center">
                {{ t('home.explorePoems') }}
              </NuxtLink>
              <button type="button" class="ds-btn-secondary min-w-[12rem] justify-center" :disabled="randomLoading"
                :aria-busy="randomLoading" @click="openRandomPoem">
                <span v-if="randomLoading"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                  aria-hidden="true" />
                {{ randomLoading ? t('home.loadingMore') : t('home.randomPoem') }}
              </button>
            </div>
          </div>

          <!-- Mobile: CTAs pinned to bottom of banner -->
          <div class="mt-auto flex flex-row items-stretch justify-center gap-2 pt-6 sm:gap-3 lg:hidden">
            <NuxtLink to="/descopera"
              class="ds-btn-primary min-w-0 flex-1 justify-center sm:min-w-[10.5rem] sm:flex-none">
              {{ t('home.explorePoems') }}
            </NuxtLink>
            <button type="button" class="ds-btn-secondary min-w-0 flex-1 justify-center sm:min-w-[10.5rem] sm:flex-none"
              :disabled="randomLoading" :aria-busy="randomLoading" @click="openRandomPoem">
              <span v-if="randomLoading"
                class="h-4 w-4 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                aria-hidden="true" />
              {{ randomLoading ? t('home.loadingMore') : t('home.randomPoem') }}
            </button>
          </div>

          <figure class="mx-auto hidden w-full max-w-md lg:block lg:max-w-none">
            <div class="overflow-hidden rounded-ds-xl border border-edge-subtle shadow-ds-card">
              <img src="/hero-banner.png" :alt="t('home.heroBannerAlt')" width="1200" height="800" fetchpriority="high"
                class="aspect-[4/3] w-full object-cover">
            </div>
          </figure>
        </div>
      </div>
      <div class="px-4 text-center md:px-8 lg:hidden">
        <DsFleuron class="mx-auto mt-6" />
        <h1 class="mt-6 font-serif text-display-sm font-semibold tracking-tight text-content">
          <span class="block">{{ t('home.heroLine1') }}</span>
          <span class="mt-1 block text-brand">{{ t('home.heroLine2') }}</span>
        </h1>
        <p
          class="mx-auto mt-5 hidden max-w-reading text-base leading-relaxed text-content-secondary sm:block md:text-lg">
          {{ t('home.subtitle') }}
        </p>
      </div>
      <div class="hidden sm:block ds-masthead-rule mx-auto mt-10 max-w-reading lg:mt-12" />
    </section>

    <div class="mx-auto max-w-content">
      <section class="pt-8 md:pt-10" :aria-label="t('nav.search')">
        <SearchBar
          v-model="searchQuery"
          class="mx-auto max-w-xl"
          @clear="clearSearch"
        />
      </section>

      <!-- Search results -->
      <section v-if="showSearchResults" class="py-10 md:py-14">
        <p
          v-if="searchError"
          class="mb-4 text-sm text-danger"
          role="alert"
        >
          {{ searchError }}
        </p>

        <div v-if="searchLoading" class="space-y-6 py-4">
          <DsSkeleton v-for="n in 3" :key="n" :lines="4" />
        </div>

        <template v-else-if="searched">
          <p
            v-if="searchResults.length"
            class="mb-4 text-sm text-content-muted"
          >
            {{ t('search.resultsLine', { count: searchResults.length, q: searchQuery.trim() }) }}
          </p>

          <div
            v-if="searchResults.length"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <PoetryCard
              v-for="poem in searchResults"
              :key="poem.id"
              :poem="poem"
              :quick-read-list="searchResults"
            />
          </div>

          <DsEmpty
            v-else
            :title="t('search.noResults', { q: searchQuery.trim() })"
            :description="t('search.tryBrowse')"
          >
            <NuxtLink to="/descopera" class="ds-btn-primary">
              {{ t('nav.discover') }}
            </NuxtLink>
          </DsEmpty>
        </template>
      </section>

      <template v-else>
      <!-- Most saved -->
      <section v-if="mostSavedPoems.length" class="py-12 md:py-20">
        <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="section-title">
              {{ t('home.mostSaved') }}
            </h2>
            <p class="hidden sm:block mt-2 max-w-reading text-sm text-content-muted">
              {{ t('home.mostSavedLead') }}
            </p>
          </div>
          <NuxtLink to="/descopera" class="ds-link shrink-0 text-sm font-medium">
            {{ t('home.seeAll') }}
          </NuxtLink>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="poem in mostSavedPoems" :key="poem.id" :poem="poem" :quick-read-list="mostSavedPoems" />
        </div>
      </section>

      <!-- Authors spotlight -->
      <section v-if="spotlightAuthors.length" class="border-t border-edge-subtle py-12 md:py-20">
        <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 class="section-title">
            {{ t('home.authorsSpotlight') }}
          </h2>
          <NuxtLink to="/descopera" class="ds-link shrink-0 text-sm font-medium">
            {{ t('home.allAuthors') }}
          </NuxtLink>
        </div>
        <div class="-mx-1 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <NuxtLink v-for="author in spotlightAuthors" :key="author.id" :to="`/authors/${author.slug}`"
            class="inline-flex min-h-[2.75rem] w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-ds-lg border border-edge-subtle bg-surface-raised p-3 text-center transition hover:border-edge hover:shadow-ds-card">
            <img :src="authorAvatarUrl(author)" :alt="author.name" width="56" height="56" loading="lazy"
              class="h-14 w-14 rounded-full object-cover ring-2 ring-edge-subtle">
            <span class="line-clamp-2 font-serif text-sm font-medium leading-tight text-content">
              {{ author.name }}
            </span>
            <span class="text-ui-xs text-content-muted">
              {{ t('authors.poemCount', author._count.poems) }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- Continue from favorites -->
      <section v-if="showFavoritesSection" class="border-t border-edge-subtle py-12 md:py-20">
        <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 class="section-title">
            {{ t('home.continueFavorites') }}
          </h2>
          <NuxtLink to="/favorites" class="ds-link shrink-0 text-sm font-medium">
            {{ t('home.sidebarLikedAll') }}
          </NuxtLink>
        </div>
        <div class="grid gap-6 sm:grid-cols-2">
          <PoetryCard v-for="poem in homeFavorites" :key="poem.id" :poem="poem" :quick-read-list="homeFavorites" />
        </div>
      </section>

      <!-- Tools -->
      <section class="border-t border-edge-subtle py-12 md:py-20">
        <h2 class="section-title mb-8 text-center">
          {{ t('home.toolsTitle') }}
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink to="/write" class="ds-card group flex flex-col gap-3 p-6 transition hover:shadow-ds-card-hover">
            <p class="ds-eyebrow">
              {{ t('nav.write') }}
            </p>
            <p class="font-serif text-xl font-semibold text-content transition group-hover:text-brand">
              {{ t('home.toolWriteTitle') }}
            </p>
            <p class="text-sm leading-relaxed text-content-secondary">
              {{ t('home.toolWriteLead') }}
            </p>
          </NuxtLink>
          <NuxtLink to="/descopera" class="ds-card group flex flex-col gap-3 p-6 transition hover:shadow-ds-card-hover">
            <p class="ds-eyebrow">
              {{ t('nav.discover') }}
            </p>
            <p class="font-serif text-xl font-semibold text-content transition group-hover:text-brand">
              {{ t('home.toolDiscoverTitle') }}
            </p>
            <p class="text-sm leading-relaxed text-content-secondary">
              {{ t('home.toolDiscoverLead') }}
            </p>
          </NuxtLink>
          <NuxtLink to="/carousel-generator"
            class="ds-card group flex flex-col gap-3 p-6 transition hover:shadow-ds-card-hover">
            <p class="ds-eyebrow">
              {{ t('nav.carousel') }}
            </p>
            <p class="font-serif text-xl font-semibold text-content transition group-hover:text-brand">
              {{ t('home.toolCarouselTitle') }}
            </p>
            <p class="text-sm leading-relaxed text-content-secondary">
              {{ t('home.toolCarouselLead') }}
            </p>
          </NuxtLink>
        </div>
        <p v-if="!isLoggedIn && !showFavoritesSection" class="mt-8 text-center text-sm text-content-muted">
          {{ t('favorites.hint') }}
          <NuxtLink to="/login"
            class="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:text-brand-hover">
            {{ t('favorites.signInToSync') }}
          </NuxtLink>
        </p>
      </section>
      </template>
    </div>
  </div>
</template>
