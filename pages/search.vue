<script setup lang="ts">
import { useSearch } from '~/composables/useSearch'

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.searchTitle')) })

const { query, results, loading, error, searched, search, clear } = useSearch()

// Support ?q= URL param for direct links
const route = useRoute()
onMounted(() => {
  if (route.query.q) {
    query.value = String(route.query.q)
    search()
  }
})
</script>

<template>
  <div class="animate-fade-in">
    <h1 class="mb-8 font-serif text-3xl font-bold text-ink-900">{{ t('search.title') }}</h1>

    <!-- Search input -->
    <div class="w-full">
      <SearchBar
        v-model="query"
        :placeholder="t('search.placeholder')"
        autofocus
        @search="search"
        @clear="clear"
      />
    </div>

    <!-- Results -->
    <div class="mt-10">
      <!-- Loading -->
      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-48 animate-pulse rounded-2xl bg-ink-200/80" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center text-red-600">{{ error }}</div>

      <!-- No results -->
      <div v-else-if="searched && !results.length" class="py-16 text-center">
        <p class="font-serif text-xl text-ink-600">{{ t('search.noResults', { q: query }) }}</p>
        <p class="mt-2 text-sm text-ink-500">
          {{ t('search.tryBrowse') }} <NuxtLink to="/poems" class="underline hover:text-ink-800">{{ t('search.category') }}</NuxtLink>.
        </p>
      </div>

      <!-- Results grid -->
      <div v-else-if="results.length">
        <p class="mb-5 text-sm text-ink-600">
          {{ results.length === 1 ? t('search.oneResult', { q: query }) : t('search.manyResults', { q: query, count: results.length }) }}
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="poem in results" :key="poem.id" :poem="poem" />
        </div>
      </div>

      <!-- Initial prompt -->
      <div v-else class="py-16 text-center">
        <p class="font-serif text-lg text-ink-600">{{ t('search.prompt') }}</p>
      </div>
    </div>
  </div>
</template>
