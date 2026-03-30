<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

const { t } = useI18n()

const route = useRoute()
const slug  = route.params.slug as string

const { data: poem, error } = await useFetch<Poem>(`/api/poems/${slug}`)

if (error.value || !poem.value) {
  throw createError({ statusCode: 404, statusMessage: t('poem.notFound') })
}

useSeoMeta({
  title:         computed(() => t('seo.poemTitle', { title: poem.value?.title ?? '' })),
  description:   computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
  ogTitle:       computed(() => poem.value?.title ?? ''),
  ogDescription: computed(() => poem.value?.excerpt ?? poem.value?.content.slice(0, 160)),
})

// Related poems by same author (exclude current poem in the API so we always get N others)
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
        class="mb-8 inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('poem.back') }}
      </NuxtLink>

      <!-- Full poem viewer with carousel mode -->
      <PoetryViewer :poem="poem" />

      <!-- Related poems -->
      <section v-if="related.length && poem.author" class="mt-20 border-t border-ink-200/80 pt-16">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 class="font-serif text-xl font-bold text-ink-800">
            {{ t('poem.moreBy', { name: poem.author.name }) }}
          </h2>
          <NuxtLink
            :to="`/authors/${poem.author.slug}`"
            class="text-sm text-ink-500 transition-colors hover:text-gold-700"
          >
            {{ t('poem.viewAllPoems') }}
          </NuxtLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="p in related" :key="p.id" :poem="p" view="grid" />
        </div>
      </section>
    </div>
  </div>
</template>
