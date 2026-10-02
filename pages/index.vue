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
  <div class="home-page">
    <!-- Hero -->
    <section class="home-page__hero">
      <div class="home-page__hero-stage">
        <!-- Mobile: banner as atmospheric background -->
        <div
          class="home-page__hero-bg"
          role="img" :aria-label="t('home.heroBannerAlt')" />
        <div
          class="home-page__hero-veil"
          aria-hidden="true" />

        <div class="home-page__hero-inner">
          <!-- Desktop copy column -->
          <div class="home-page__hero-copy">
            <DsFleuron class="home-page__fleuron" />
            <h1 class="home-page__title">
              <span class="home-page__title-line">{{ t('home.heroLine1') }}</span>
              <span class="home-page__title-line home-page__title-line--brand">{{ t('home.heroLine2') }}</span>
            </h1>
            <p class="home-page__subtitle">
              {{ t('home.subtitle') }}
            </p>
            <div class="home-page__cta-row">
              <NuxtLink to="/descopera" class="ds-btn-primary home-page__cta">
                {{ t('home.explorePoems') }}
              </NuxtLink>
              <button type="button" class="ds-btn-secondary home-page__cta" :disabled="randomLoading"
                :aria-busy="randomLoading" @click="openRandomPoem">
                <span v-if="randomLoading" class="home-page__spinner" aria-hidden="true" />
                {{ randomLoading ? t('home.loadingMore') : t('home.randomPoem') }}
              </button>
            </div>
          </div>

          <!-- Mobile: CTAs pinned to bottom of banner -->
          <div class="home-page__cta-mobile">
            <NuxtLink to="/descopera" class="ds-btn-primary home-page__cta-mobile-btn">
              {{ t('home.explorePoems') }}
            </NuxtLink>
            <button type="button" class="ds-btn-secondary home-page__cta-mobile-btn"
              :disabled="randomLoading" :aria-busy="randomLoading" @click="openRandomPoem">
              <span v-if="randomLoading" class="home-page__spinner" aria-hidden="true" />
              {{ randomLoading ? t('home.loadingMore') : t('home.randomPoem') }}
            </button>
          </div>

          <figure class="home-page__figure">
            <div class="home-page__figure-frame">
              <img src="/hero-banner.png" :alt="t('home.heroBannerAlt')" width="1200" height="800" fetchpriority="high"
                class="home-page__figure-img">
            </div>
          </figure>
        </div>
      </div>
      <div class="home-page__mobile-copy">
        <DsFleuron class="home-page__fleuron home-page__fleuron--mobile" />
        <h1 class="home-page__mobile-title">
          <span class="home-page__title-line">{{ t('home.heroLine1') }}</span>
          <span class="home-page__title-line home-page__title-line--brand">{{ t('home.heroLine2') }}</span>
        </h1>
        <p class="home-page__mobile-subtitle">
          {{ t('home.subtitle') }}
        </p>
      </div>
      <div class="ds-masthead-rule home-page__masthead-rule" />
    </section>

    <div class="home-page__body">
      <section class="home-page__search" :aria-label="t('nav.search')">
        <SearchBar
          v-model="searchQuery"
          class="home-page__search-bar"
          @clear="clearSearch"
        />
      </section>

      <!-- Search results -->
      <section v-if="showSearchResults" class="home-page__results">
        <p
          v-if="searchError"
          class="home-page__alert"
          role="alert"
        >
          {{ searchError }}
        </p>

        <div v-if="searchLoading" class="home-page__skeleton">
          <DsSkeleton v-for="n in 3" :key="n" :lines="4" />
        </div>

        <template v-else-if="searched">
          <p
            v-if="searchResults.length"
            class="home-page__results-meta"
          >
            {{ t('search.resultsLine', { count: searchResults.length, q: searchQuery.trim() }) }}
          </p>

          <div
            v-if="searchResults.length"
            class="home-page__grid"
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
      <section v-if="mostSavedPoems.length" class="home-page__section">
        <div class="home-page__section-head">
          <div>
            <h2 class="section-title">
              {{ t('home.mostSaved') }}
            </h2>
            <p class="home-page__section-lead">
              {{ t('home.mostSavedLead') }}
            </p>
          </div>
          <NuxtLink to="/descopera" class="ds-link home-page__section-link">
            {{ t('home.seeAll') }}
          </NuxtLink>
        </div>
        <div class="home-page__grid home-page__grid--gap-6">
          <PoetryCard v-for="poem in mostSavedPoems" :key="poem.id" :poem="poem" :quick-read-list="mostSavedPoems" />
        </div>
      </section>

      <!-- Authors spotlight -->
      <section v-if="spotlightAuthors.length" class="home-page__section home-page__section--ruled">
        <div class="home-page__section-head">
          <h2 class="section-title">
            {{ t('home.authorsSpotlight') }}
          </h2>
          <NuxtLink to="/descopera" class="ds-link home-page__section-link">
            {{ t('home.allAuthors') }}
          </NuxtLink>
        </div>
        <div class="home-page__authors-rail">
          <NuxtLink v-for="author in spotlightAuthors" :key="author.id" :to="`/authors/${author.slug}`"
            class="home-page__author-chip">
            <img :src="authorAvatarUrl(author)" :alt="author.name" width="56" height="56" loading="lazy"
              class="home-page__author-avatar">
            <span class="home-page__author-name">
              {{ author.name }}
            </span>
            <span class="home-page__author-count">
              {{ t('authors.poemCount', author._count.poems) }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- Continue from favorites -->
      <section v-if="showFavoritesSection" class="home-page__section home-page__section--ruled">
        <div class="home-page__section-head">
          <h2 class="section-title">
            {{ t('home.continueFavorites') }}
          </h2>
          <NuxtLink to="/favorites" class="ds-link home-page__section-link">
            {{ t('home.sidebarLikedAll') }}
          </NuxtLink>
        </div>
        <div class="home-page__grid home-page__grid--gap-6 home-page__grid--two">
          <PoetryCard v-for="poem in homeFavorites" :key="poem.id" :poem="poem" :quick-read-list="homeFavorites" />
        </div>
      </section>

      <!-- Tools -->
      <section class="home-page__section home-page__section--ruled">
        <h2 class="section-title home-page__tools-title">
          {{ t('home.toolsTitle') }}
        </h2>
        <div class="home-page__grid home-page__grid--gap-6 home-page__grid--tools">
          <NuxtLink to="/write" class="ds-card home-page__tool-card">
            <p class="ds-eyebrow">
              {{ t('nav.write') }}
            </p>
            <p class="home-page__tool-title">
              {{ t('home.toolWriteTitle') }}
            </p>
            <p class="home-page__tool-lead">
              {{ t('home.toolWriteLead') }}
            </p>
          </NuxtLink>
          <NuxtLink to="/descopera" class="ds-card home-page__tool-card">
            <p class="ds-eyebrow">
              {{ t('nav.discover') }}
            </p>
            <p class="home-page__tool-title">
              {{ t('home.toolDiscoverTitle') }}
            </p>
            <p class="home-page__tool-lead">
              {{ t('home.toolDiscoverLead') }}
            </p>
          </NuxtLink>
          <NuxtLink to="/carousel-generator" class="ds-card home-page__tool-card">
            <p class="ds-eyebrow">
              {{ t('nav.carousel') }}
            </p>
            <p class="home-page__tool-title">
              {{ t('home.toolCarouselTitle') }}
            </p>
            <p class="home-page__tool-lead">
              {{ t('home.toolCarouselLead') }}
            </p>
          </NuxtLink>
        </div>
        <p v-if="!isLoggedIn && !showFavoritesSection" class="home-page__signin-hint">
          {{ t('favorites.hint') }}
          <NuxtLink to="/login" class="home-page__signin-link">
            {{ t('favorites.signInToSync') }}
          </NuxtLink>
        </p>
      </section>
      </template>
    </div>
  </div>
</template>
