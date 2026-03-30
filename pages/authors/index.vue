<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.authorsTitle')) })

const page    = ref(1)
const search  = ref('')
const loading = ref(false)

const { data, refresh } = await useFetch('/api/authors', {
  params: computed(() => ({ page: page.value, limit: 20, search: search.value || undefined })),
  watch: [page],
})

// Debounced search
let timer: ReturnType<typeof setTimeout>
watch(search, (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => { page.value = 1; refresh() }, 350)
})

const authors    = computed(() => data.value?.data   ?? [])
const meta       = computed(() => data.value?.meta)
const totalPages = computed(() => meta.value?.totalPages ?? 1)
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="font-serif text-3xl font-bold text-ink-900">{{ t('authors.title') }}</h1>
      <div class="w-full">
        <SearchBar v-model="search" :placeholder="t('authors.searchPlaceholder')" />
      </div>
    </div>

    <!-- Grid -->
    <div v-if="authors.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AuthorCard v-for="author in authors" :key="author.id" :author="author" />
    </div>

    <div v-else class="py-16 text-center text-ink-600">
      <p class="font-serif text-lg">{{ t('authors.none') }}</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-10">
      <PaginationNav
        :page="page"
        :total-pages="totalPages"
        @update:page="(p) => { page = p }"
      />
    </div>
  </div>
</template>
