<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

const { t } = useI18n()
const config = useRuntimeConfig()

const route = useRoute()
const slug  = route.params.slug as string

const { data: poem, error } = await useFetch<Poem>(`/api/poems/${slug}`)

if (error.value || !poem.value) {
  throw createError({ statusCode: 404, statusMessage: t('poem.notFound') })
}

const ogImage = computed(() => poem.value?.author?.imageUrl || `${config.public.appUrl}/favicon.svg`)

useSeoMeta({
  title:         computed(() => t('seo.poemTitle', { title: poem.value?.title ?? '' })),
  description:   computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
  ogTitle:       computed(() => poem.value?.title ?? ''),
  ogDescription: computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
  ogImage,
  twitterCard:   'summary_large_image',
  twitterImage:  ogImage,
})

// ── Poem Insight (lazy — client only, non-blocking) ──────────────────────────
const insightOpen = ref(false)
const {
  data: insightData,
  pending: insightPending,
  error: insightError,
  execute: fetchInsight,
} = useLazyFetch<{ insight: string }>(`/api/poems/${slug}/insight`, {
  immediate: false,
  server: false,
})

function toggleInsight() {
  insightOpen.value = !insightOpen.value
  if (insightOpen.value && !insightData.value && !insightPending.value) {
    void fetchInsight()
  }
}

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
    <div v-if="poem">
      <!-- Back link -->
      <NuxtLink
        to="/poems"
        class="mb-8 inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('poem.back') }}
      </NuxtLink>

      <!-- Prev / next in catalog order (same as /poems list) — above the poem -->
      <nav
        v-if="poem.navigation"
        class="mb-10 flex flex-col gap-3 border-b border-edge/80 pb-8 sm:flex-row sm:items-stretch sm:justify-between"
        :aria-label="t('a11y.poemNavigation')"
      >
        <div class="min-w-0 flex-1">
          <NuxtLink
            v-if="poem.navigation.newer"
            :to="`/poems/${poem.navigation.newer.slug}`"
            class="group flex items-start gap-3 rounded-lg border border-edge bg-surface-subtle/70 p-4 text-left transition-colors hover:border-brand/40 hover:bg-surface-subtle"
            :aria-label="t('poem.navNewerAria', { title: poem.navigation.newer.title })"
          >
            <span class="mt-0.5 shrink-0 text-content-soft transition-colors group-hover:text-brand" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block text-xs font-medium uppercase tracking-wide text-content-muted">{{ t('poem.navNewer') }}</span>
              <span class="mt-0.5 line-clamp-2 font-serif text-base text-content">{{ poem.navigation.newer.title }}</span>
            </span>
          </NuxtLink>
          <div
            v-else
            class="flex items-start gap-3 rounded-lg border border-dashed border-edge/60 bg-surface-subtle/40 p-4 opacity-60"
          >
            <span class="mt-0.5 shrink-0 text-content-soft" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span class="text-sm text-content-muted">{{ t('poem.navNewer') }}</span>
          </div>
        </div>
        <div class="min-w-0 flex-1 sm:text-right">
          <NuxtLink
            v-if="poem.navigation.older"
            :to="`/poems/${poem.navigation.older.slug}`"
            class="group flex items-start justify-end gap-3 rounded-lg border border-edge bg-surface-subtle/70 p-4 text-right transition-colors hover:border-brand/40 hover:bg-surface-subtle sm:ml-auto"
            :aria-label="t('poem.navOlderAria', { title: poem.navigation.older.title })"
          >
            <span class="min-w-0 sm:order-first">
              <span class="block text-xs font-medium uppercase tracking-wide text-content-muted">{{ t('poem.navOlder') }}</span>
              <span class="mt-0.5 line-clamp-2 font-serif text-base text-content">{{ poem.navigation.older.title }}</span>
            </span>
            <span class="mt-0.5 shrink-0 text-content-soft transition-colors group-hover:text-brand sm:order-last" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
          <div
            v-else
            class="flex items-start justify-end gap-3 rounded-lg border border-dashed border-edge/60 bg-surface-subtle/40 p-4 opacity-60 sm:ml-auto"
          >
            <span class="text-sm text-content-muted">{{ t('poem.navOlder') }}</span>
            <span class="mt-0.5 shrink-0 text-content-soft" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </nav>

      <!-- Full poem viewer with carousel mode -->
      <PoetryViewer :poem="poem" />

      <!-- AI Poem Insight -->
      <div class="mt-10 border-t border-edge/80 pt-8">
        <button
          class="flex items-center gap-2 text-sm text-content-secondary transition-colors hover:text-brand"
          @click="toggleInsight"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="insightOpen ? 'rotate-90' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span class="font-medium">{{ insightOpen ? t('insight.hide') : t('insight.show') }}</span>
          <span class="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">AI</span>
        </button>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="insightOpen" class="mt-5 rounded-xl border border-edge bg-surface-subtle/60 p-6">
            <!-- Loading -->
            <div v-if="insightPending" class="flex items-center gap-3 text-sm text-content-muted">
              <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ t('insight.loading') }}
            </div>

            <!-- Error -->
            <p v-else-if="insightError" class="text-sm text-danger">
              {{ t('insight.error') }}
            </p>

            <!-- Content -->
            <div v-else-if="insightData?.insight">
              <p class="font-serif text-base leading-relaxed text-content-secondary">
                {{ insightData.insight }}
              </p>
              <p class="mt-4 text-xs text-content-muted">{{ t('insight.poweredBy') }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Related poems -->
      <section v-if="related.length && poem.author" class="mt-20 border-t border-edge/80 pt-16">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 class="font-serif text-xl font-bold text-content">
            {{ t('poem.moreBy', { name: poem.author.name }) }}
          </h2>
          <NuxtLink
            :to="`/authors/${poem.author.slug}`"
            class="text-sm text-content-muted transition-colors hover:text-brand"
          >
            {{ t('poem.viewAllPoems') }}
          </NuxtLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="p in related" :key="p.id" :poem="p" view="grid" :quick-read-list="related" />
        </div>
      </section>
    </div>
  </div>
</template>
