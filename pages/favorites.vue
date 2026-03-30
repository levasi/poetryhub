<script setup lang="ts">
import { useFavorites } from '~/composables/useFavorites'
import type { Poem } from '~/composables/usePoems'

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.favoritesTitle')) })

const { favoriteIds, count, clearAll } = useFavorites()

// Fetch all favorite poems in one batch using search by IDs
// (We fetch each individually only if count is reasonable; for MVP, fetch all and filter client-side)
const { data: allPoems } = await useFetch<{ data: Poem[] }>('/api/poems', {
  params: { limit: 200 },
})

const favorites = computed(() =>
  (allPoems.value?.data ?? []).filter((p) => favoriteIds.value.has(p.id)),
)
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl font-bold text-ink-900">{{ t('favorites.title') }}</h1>
        <p class="mt-1 text-sm text-ink-600">{{ t('favorites.count', count) }}</p>
      </div>
      <button
        v-if="count > 0"
        class="text-xs text-ink-600 underline hover:text-red-600"
        @click="clearAll"
      >
        {{ t('favorites.clearAll') }}
      </button>
    </div>

    <div v-if="favorites.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PoetryCard v-for="poem in favorites" :key="poem.id" :poem="poem" />
    </div>

    <div v-else class="py-24 text-center">
      <svg class="mx-auto mb-4 h-12 w-12 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="font-serif text-lg text-ink-600">{{ t('favorites.empty') }}</p>
      <NuxtLink to="/poems" class="mt-3 inline-block text-sm text-ink-600 underline hover:text-ink-900">
        {{ t('favorites.hint') }}
      </NuxtLink>
    </div>
  </div>
</template>
