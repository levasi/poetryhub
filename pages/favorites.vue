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
  <div class="favorites-page">
    <div class="favorites-page__header">
      <div>
        <h1 class="favorites-page__title">{{ t('favorites.title') }}</h1>
        <p class="favorites-page__count">{{ t('favorites.count', { n: count }) }}</p>
        <p v-if="!isLoggedIn" class="favorites-page__hint">
          {{ t('favorites.localOnlyHint') }}
          <NuxtLink to="/login" class="favorites-page__signin">
            {{ t('favorites.signInToSync') }}
          </NuxtLink>
        </p>
      </div>
      <button
        v-if="count > 0"
        type="button"
        class="favorites-page__clear"
        @click="clearAll"
      >
        {{ t('favorites.clearAll') }}
      </button>
    </div>

    <div v-if="pending && count > 0" class="favorites-page__skeleton">
      <DsSkeleton v-for="n in 3" :key="n" :lines="4" />
    </div>

    <div v-else-if="count > 0 && favorites.length" class="favorites-page__grid">
      <PoetryCard v-for="poem in favorites" :key="poem.id" :poem="poem" :quick-read-list="favorites" />
    </div>

    <div v-else-if="count > 0 && !favorites.length" class="favorites-page__missing">
      <p>{{ t('favorites.missingFromCatalog') }}</p>
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
