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
  <div class="animate-fade-in min-w-0">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="font-serif text-3xl font-bold text-content">{{ t('favorites.title') }}</h1>
        <p class="mt-1 text-sm text-content-muted">{{ t('favorites.count', { n: count }) }}</p>
        <p v-if="!isLoggedIn" class="mt-3 max-w-xl text-sm text-content-muted">
          {{ t('favorites.localOnlyHint') }}
          <NuxtLink to="/login" class="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:text-brand-hover">
            {{ t('favorites.signInToSync') }}
          </NuxtLink>
        </p>
      </div>
      <button
        v-if="count > 0"
        type="button"
        class="shrink-0 self-start text-xs text-content-muted underline hover:text-danger"
        @click="clearAll"
      >
        {{ t('favorites.clearAll') }}
      </button>
    </div>

    <div v-if="pending && count > 0" class="space-y-6 py-8">
      <DsSkeleton v-for="n in 3" :key="n" :lines="4" />
    </div>

    <div v-else-if="count > 0 && favorites.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PoetryCard v-for="poem in favorites" :key="poem.id" :poem="poem" :quick-read-list="favorites" />
    </div>

    <div v-else-if="count > 0 && !favorites.length" class="py-16 text-center">
      <p class="text-sm text-content-muted">{{ t('favorites.missingFromCatalog') }}</p>
    </div>

    <DsEmpty
      v-else
      :title="t('favorites.emptyTitle')"
      :description="t('favorites.emptyDescription')"
    >
      <NuxtLink to="/descopera" class="ds-btn-primary">
        {{ t('favorites.discoverCta') }}
      </NuxtLink>
    </DsEmpty>
  </div>
</template>
