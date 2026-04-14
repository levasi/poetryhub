<script setup lang="ts">
import { usePoems } from '~/composables/usePoems'
import { useFilters } from '~/composables/useFilters'

const { t } = useI18n()
const { labelForTag } = useTagLabel()

useSeoMeta({ title: computed(() => t('seo.poemsTitle')) })

const { filters, applyFilters, clearFilters, hasActiveFilters } = useFilters()
const { poems, meta, totalPages, loading, fetch } = usePoems(filters)

const [{ data: moodTags }, { data: themeTags }] = await Promise.all([
  useFetch('/api/tags', { params: { category: 'mood' } }),
  useFetch('/api/tags', { params: { category: 'theme' } }),
])

await fetch()
watch(filters, () => fetch(), { deep: true })

function onPageChange(page: number) { fetch({ page }) }

// View toggle: grid | list
const viewMode = ref<'grid' | 'list'>('grid')

// Mobile filter drawer
const filterOpen = ref(false)

// Inline search
const searchQuery = ref((filters.search as string) ?? '')
const debouncedSearch = ref(searchQuery.value)
let searchTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    applyFilters({ search: val || undefined, page: 1 })
  }, 350)
})
</script>

<template>
  <div class="animate-fade-in">
    <!-- Page header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl font-bold text-content">{{ t('poems.title') }}</h1>
        <p class="mt-0.5 text-sm text-content-secondary">{{ t('poems.count', meta?.total ?? 0) }}</p>
      </div>

      <!-- View toggle + mobile filter button -->
      <div class="flex items-center gap-2">
        <!-- Mobile: open filters -->
        <button
          class="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-raised px-3 py-2 text-xs text-content-secondary shadow-sm transition-colors hover:border-edge-strong hover:text-content md:hidden"
          @click="filterOpen = true"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {{ t('poems.filters') }}
          <span v-if="hasActiveFilters" class="h-1.5 w-1.5 rounded-full bg-brand" />
        </button>

        <!-- View toggle -->
        <div class="hidden items-center overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-sm sm:flex">
          <button
            class="rounded-l-lg px-2.5 py-2 text-xs transition-colors"
            :class="viewMode === 'grid' ? 'bg-surface-subtle text-content' : 'text-content-muted hover:text-content-secondary'"
            @click="viewMode = 'grid'"
            :aria-label="t('poems.gridView')"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            class="rounded-r-lg px-2.5 py-2 text-xs transition-colors"
            :class="viewMode === 'list' ? 'bg-surface-subtle text-content' : 'text-content-muted hover:text-content-secondary'"
            @click="viewMode = 'list'"
            :aria-label="t('poems.listView')"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Search bar -->
    <div class="relative mb-8">
      <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('poems.searchPlaceholder')"
        class="ds-input w-full rounded-xl py-3 pl-10 pr-10 text-sm shadow-sm"
      />
      <button
        v-if="searchQuery"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-soft hover:text-content-secondary"
        @click="searchQuery = ''"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="grid gap-8 md:grid-cols-[200px,1fr]">
      <!-- ── Desktop filter sidebar ─────────────────────────────────────── -->
      <aside class="hidden space-y-6 md:block">
        <FilterPanel
          :mood-tags="moodTags"
          :theme-tags="themeTags"
          :filters="filters"
          :has-active-filters="hasActiveFilters"
          @apply="applyFilters"
          @clear="clearFilters"
        />
      </aside>

      <!-- ── Poem list/grid ─────────────────────────────────────────────── -->
      <div>
        <!-- Active filter pills -->
        <div v-if="hasActiveFilters" class="mb-5 flex flex-wrap gap-2">
          <span class="text-xs text-content-secondary self-center">{{ t('poems.filteredBy') }}</span>
          <button
            v-if="filters.tag"
            class="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900 hover:bg-amber-100"
            @click="applyFilters({ tag: undefined })"
          >
            {{ labelForTag(filters.tag, filters.tag) }} ✕
          </button>
          <button
            v-if="filters.source"
            class="flex items-center gap-1 rounded-full border border-edge bg-surface-raised px-3 py-1 text-xs text-content-secondary shadow-sm hover:bg-surface-subtle"
            @click="applyFilters({ source: undefined })"
          >
            {{ filters.source }} ✕
          </button>
          <button class="text-xs text-content-secondary underline hover:text-content" @click="clearFilters">
            {{ t('poems.clearAll') }}
          </button>
        </div>

        <!-- Loading -->
        <template v-if="loading">
          <div v-if="viewMode === 'grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 9" :key="i" class="h-52 animate-pulse rounded-2xl bg-edge/80" />
          </div>
          <div v-else class="space-y-1">
            <div v-for="i in 9" :key="i" class="h-20 animate-pulse rounded-xl bg-edge/60" />
          </div>
        </template>

        <!-- Empty -->
        <div v-else-if="!poems.length" class="py-20 text-center">
          <p class="font-serif text-xl text-content-secondary">{{ t('poems.noPoems') }}</p>
          <button v-if="hasActiveFilters" class="mt-3 text-sm text-content-secondary underline hover:text-content" @click="clearFilters">
            {{ t('poems.clearFilters') }}
          </button>
        </div>

        <!-- Grid view -->
        <div v-else-if="viewMode === 'grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PoetryCard v-for="poem in poems" :key="poem.id" :poem="poem" view="grid" :quick-read-list="poems" />
        </div>

        <!-- List view -->
        <div v-else class="divide-y divide-edge/80">
          <PoetryCard v-for="poem in poems" :key="poem.id" :poem="poem" view="list" :quick-read-list="poems" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-10">
          <PaginationNav
            :page="meta?.page ?? 1"
            :total-pages="totalPages"
            :loading="loading"
            @update:page="onPageChange"
          />
        </div>
      </div>
    </div>

    <!-- ── Mobile filter drawer ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="filterOpen" class="fixed inset-0 z-50 flex md:hidden" @click.self="filterOpen = false">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="filterOpen = false" />
          <div class="relative ml-auto h-full w-72 overflow-y-auto border-l border-edge bg-surface-raised p-6 shadow-2xl">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="font-serif text-lg font-bold text-content">{{ t('poems.filters') }}</h2>
              <button type="button" class="text-content-muted hover:text-content" :aria-label="t('a11y.closeFilters')" @click="filterOpen = false">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel
              :mood-tags="moodTags"
              :theme-tags="themeTags"
              :filters="filters"
              :has-active-filters="hasActiveFilters"
              @apply="(f) => { applyFilters(f); filterOpen = false }"
              @clear="() => { clearFilters(); filterOpen = false }"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.25s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .relative, .drawer-leave-to .relative { transform: translateX(100%); }
</style>
