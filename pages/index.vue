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

const { data: poemStats } = await useFetch<{ meta: { total: number } }>('/api/poems', {
  query: { limit: 1 },
})

const poemCount = computed(() => poemStats.value?.meta?.total ?? 0)
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
  <div class="animate-fade-in">
    <!-- Hero -->
    <section class="mx-auto max-w-content px-0 pt-6 md:pt-10">
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:gap-12 xl:gap-16">
        <div class="text-center lg:text-left">
          <DsFleuron class="mx-auto mb-6 lg:mx-0" />
          <h1 class="font-serif text-display-sm font-semibold tracking-tight text-content">
            <span class="block">{{ t('home.heroLine1') }}</span>
            <span class="mt-1 block text-brand">{{ t('home.heroLine2') }}</span>
          </h1>
          <p class="mx-auto mt-5 max-w-reading text-base leading-relaxed text-content-secondary md:text-lg lg:mx-0">
            {{ t('home.subtitle') }}
          </p>
          <p v-if="poemCount > 0" class="mt-3 text-ui-sm font-medium text-content-muted">
            {{ t('home.heroPoemCount', { n: poemCount }) }}
          </p>

          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
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

        <figure class="mx-auto w-full max-w-md lg:max-w-none">
          <div class="overflow-hidden rounded-ds-xl border border-edge-subtle shadow-ds-card">
            <img src="/hero-banner.png" :alt="t('home.heroBannerAlt')" width="1200" height="800" fetchpriority="high"
              class="aspect-[4/3] w-full object-cover">
          </div>
        </figure>
      </div>
      <div class="ds-masthead-rule mx-auto mt-10 max-w-reading lg:mt-12" />
    </section>

    <div class="mx-auto max-w-content">
      <!-- Most saved -->
      <section v-if="mostSavedPoems.length" class="py-16 md:py-20">
        <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="section-title">
              {{ t('home.mostSaved') }}
            </h2>
            <p class="mt-2 max-w-reading text-sm text-content-muted">
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
      <section v-if="spotlightAuthors.length" class="border-t border-edge-subtle py-16 md:py-20">
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
      <section v-if="showFavoritesSection" class="border-t border-edge-subtle py-16 md:py-20">
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
      <section class="border-t border-edge-subtle py-16 md:py-20">
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
    </div>
  </div>
</template>
