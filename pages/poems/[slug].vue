<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

definePageMeta({
  layout: 'fullwidth',
})

const { t } = useI18n()
const config = useRuntimeConfig()

const route = useRoute()
const slug = route.params.slug as string

const { data: poem, error } = await useFetch<Poem>(`/api/poems/${slug}`)

if (error.value || !poem.value) {
  throw createError({ statusCode: 404, statusMessage: t('poem.notFound') })
}

const ogImage = computed(() => poem.value?.author?.imageUrl || `${config.public.appUrl}/favicon.svg`)

useSeoMeta({
  title: computed(() => t('seo.poemTitle', { title: poem.value?.title ?? '' })),
  description: computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
  ogTitle: computed(() => poem.value?.title ?? ''),
  ogDescription: computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
})

// ── Related poems by same author ──────────────────────────────────────────────
const authorSlug = poem.value.author?.slug ?? ''
const { data: relatedRes } = await useAsyncData(
  `poem-related-${slug}`,
  () =>
    authorSlug
      ? $fetch<{ data: Poem[] }>('/api/poems', {
        params: { author: authorSlug, excludeSlug: slug, limit: 6 },
      })
      : Promise.resolve({ data: [] }),
  { default: () => ({ data: [] }) },
)

const related = computed(() => relatedRes.value?.data ?? [])
</script>

<template>
  <div class="animate-fade-in">
    <div v-if="poem" class="w-full min-w-0 px-4 pb-24 pt-3 md:px-8 md:pt-8 lg:px-10 xl:px-12">
      <!-- Prev / next in catalog order — above the poem -->
      <nav v-if="poem.navigation" class="mb-12 grid gap-3 border-b border-edge-subtle pb-10 sm:grid-cols-2 sm:gap-4"
        :aria-label="t('a11y.poemNavigation')">
        <div class="min-w-0">
          <NuxtLink v-if="poem.navigation.newer" :to="`/poems/${poem.navigation.newer.slug}`"
            class="group flex h-full min-h-[4.5rem] items-start gap-3 rounded-ds-lg border border-edge-subtle bg-surface-raised p-4 text-left shadow-ds-card transition-all hover:border-brand/35 hover:shadow-ds-card-hover"
            :aria-label="t('poem.navNewerAria', { title: poem.navigation.newer.title })">
            <span class="mt-0.5 shrink-0 text-content-soft transition-colors group-hover:text-brand" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block text-ui-xs font-semibold uppercase tracking-wider text-content-muted">{{
                t('poem.navNewer') }}</span>
              <span class="mt-1 line-clamp-2 font-serif text-base font-medium leading-snug text-content">{{
                poem.navigation.newer.title }}</span>
            </span>
          </NuxtLink>
          <div v-else
            class="flex h-full min-h-[4.5rem] items-start gap-3 rounded-ds-lg border border-dashed border-edge-subtle bg-surface-subtle/50 p-4 text-content-muted">
            <span class="mt-0.5 shrink-0 text-content-soft/80" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span class="self-center text-sm">{{ t('poem.navNewer') }}</span>
          </div>
        </div>
        <div class="min-w-0 sm:text-right">
          <NuxtLink v-if="poem.navigation.older" :to="`/poems/${poem.navigation.older.slug}`"
            class="group flex h-full min-h-[4.5rem] items-start justify-end gap-3 rounded-ds-lg border border-edge-subtle bg-surface-raised p-4 text-right shadow-ds-card transition-all hover:border-brand/35 hover:shadow-ds-card-hover sm:ml-auto"
            :aria-label="t('poem.navOlderAria', { title: poem.navigation.older.title })">
            <span class="min-w-0 sm:order-first">
              <span class="block text-ui-xs font-semibold uppercase tracking-wider text-content-muted">{{
                t('poem.navOlder') }}</span>
              <span class="mt-1 line-clamp-2 font-serif text-base font-medium leading-snug text-content">{{
                poem.navigation.older.title }}</span>
            </span>
            <span class="mt-0.5 shrink-0 text-content-soft transition-colors group-hover:text-brand sm:order-last"
              aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
          <div v-else
            class="flex h-full min-h-[4.5rem] items-start justify-end gap-3 rounded-ds-lg border border-dashed border-edge-subtle bg-surface-subtle/50 p-4 text-content-muted sm:ml-auto">
            <span class="self-center text-sm">{{ t('poem.navOlder') }}</span>
            <span class="mt-0.5 shrink-0 text-content-soft/80" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </nav>

      <!-- Full poem viewer with carousel mode -->
      <PoetryViewer :poem="poem" />

      <!-- Related poems -->
      <section v-if="related.length && poem.author" class="mt-20 border-t border-edge-subtle pt-14 md:mt-24 md:pt-16">
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <h2 class="ds-section-heading text-pretty">
            {{ t('poem.moreBy', { name: poem.author.name }) }}
          </h2>
          <NuxtLink :to="`/authors/${poem.author.slug}`"
            class="shrink-0 text-sm font-medium text-content-muted underline-offset-4 transition-colors hover:text-brand hover:underline">
            {{ t('poem.viewAllPoems') }}
          </NuxtLink>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="p in related" :key="p.id" :poem="p" view="grid" :quick-read-list="related" />
        </div>
      </section>
    </div>
  </div>
</template>
