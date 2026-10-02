<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta({ title: computed(() => t('seo.searchTitle')) })

const { query, results, loading, error, searched, clear } = useSearch()

// Seed from ?q= when landing / sharing a search URL
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) query.value = q
})

watch(query, (q) => {
  const trimmed = q.trim()
  const current = typeof route.query.q === 'string' ? route.query.q : ''
  if (trimmed === current) return
  router.replace({ query: trimmed ? { q: trimmed } : {} })
})
</script>

<template>
  <div class="search-page">
    <div class="search-page__header">
      <h1 class="search-page__title">
        {{ t('search.title') }}
      </h1>
      <p class="search-page__prompt">
        {{ t('search.prompt') }}
      </p>
    </div>

    <SearchBar v-model="query" autofocus class="search-page__bar" @clear="clear" />

    <p v-if="error" class="search-page__alert" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="search-page__skeleton">
      <DsSkeleton v-for="n in 3" :key="n" :lines="4" />
    </div>

    <template v-else-if="searched">
      <p v-if="results.length" class="search-page__meta">
        {{ t('search.resultsLine', { count: results.length, q: query.trim() }) }}
      </p>

      <div v-if="results.length" class="search-page__grid">
        <PoetryCard v-for="poem in results" :key="poem.id" :poem="poem" :quick-read-list="results" />
      </div>

      <DsEmpty v-else :title="t('search.noResults', { q: query.trim() })" :description="t('search.tryBrowse')">
        <NuxtLink to="/descopera" class="ds-btn-primary">
          {{ t('nav.discover') }}
        </NuxtLink>
      </DsEmpty>
    </template>
  </div>
</template>
