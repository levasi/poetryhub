<script setup lang="ts">
import { useFavorites } from '~/composables/useFavorites'
import type { Poem } from '~/composables/usePoems'

const { t } = useI18n()
const { isLoggedIn } = useAuth()

useSeoMeta({ title: computed(() => t('seo.favoritesTitle')) })

const { favoriteIdOrder, count, clearAll } = useFavorites()

const idsParam = computed(() => favoriteIdOrder.value.join(','))

const { data: payload, pending } = useFetch<{ data: Poem[] }>('/api/poems/by-ids', {
  query: computed(() => ({ ids: idsParam.value })),
  watch: [idsParam],
})

/** Preserve favorite order; drop missing poems (removed from catalog). */
const favorites = computed(() => {
  const list = payload.value?.data ?? []
  const byId = new Map(list.map((p) => [p.id, p]))
  return favoriteIdOrder.value.map((id) => byId.get(id)).filter((p): p is Poem => p != null)
})
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="font-serif text-3xl font-bold text-ink-900">{{ t('favorites.title') }}</h1>
        <p class="mt-1 text-sm text-ink-600">{{ t('favorites.count', { n: count }) }}</p>
        <p v-if="!isLoggedIn" class="mt-3 max-w-xl text-sm text-ink-600">
          {{ t('favorites.localOnlyHint') }}
          <NuxtLink to="/login" class="font-medium text-gold-800 underline decoration-gold-300 underline-offset-2 hover:text-gold-900">
            {{ t('favorites.signInToSync') }}
          </NuxtLink>
        </p>
      </div>
      <button
        v-if="count > 0"
        type="button"
        class="shrink-0 self-start text-xs text-ink-600 underline hover:text-red-600"
        @click="clearAll"
      >
        {{ t('favorites.clearAll') }}
      </button>
    </div>

    <div v-if="pending && count > 0" class="flex min-h-[8rem] items-center justify-center">
      <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand" aria-hidden="true" />
    </div>

    <div v-else-if="count > 0 && favorites.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PoetryCard v-for="poem in favorites" :key="poem.id" :poem="poem" />
    </div>

    <div v-else-if="count > 0 && !favorites.length" class="py-16 text-center">
      <p class="text-sm text-ink-600">{{ t('favorites.missingFromCatalog') }}</p>
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
