<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { authorAvatarUrl } from '~/utils/authorAvatar'

const { t } = useI18n()
const route = useRoute()

const activeAuthorSlug = computed(() => {
  const a = route.query.author
  if (typeof a === 'string') return a
  if (Array.isArray(a) && a[0]) return String(a[0])
  return ''
})

interface AuthorRow {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  _count?: { poems: number }
}

const page = ref(1)
const search = ref('')

const { data, pending, refresh } = await useFetch<{ data: AuthorRow[] }>('/api/authors', {
  params: computed(() => ({
    page: page.value,
    limit: 80,
    search: search.value.trim() || undefined,
  })),
  watch: [page],
})

let debounceTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    refresh()
  }, 350)
})

const authors = computed(() => data.value?.data ?? [])
</script>

<template>
  <div>
    <p class="mb-3 px-1 text-ui-xs font-semibold uppercase tracking-wider text-content-soft">
      {{ t('home.sidebarAuthorsHeading') }}
    </p>
    <div class="relative mb-3">
      <Icon icon="heroicons:magnifying-glass"
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-hint"
        aria-hidden="true" />
      <input v-model="search" type="search" autocomplete="off" :placeholder="t('authors.searchPlaceholder')"
        class="w-full rounded-full border-0 bg-surface-subtle py-2 pl-9 pr-3 text-sm text-content placeholder:text-content-hint outline-none ring-1 ring-transparent transition-shadow focus:ring-2 focus:ring-brand/35">
    </div>

    <div :aria-busy="pending">
      <div v-if="pending" class="flex justify-center py-8" role="status">
        <span class="h-7 w-7 animate-spin rounded-full border-2 border-edge-subtle border-t-brand" aria-hidden="true" />
      </div>
      <ul v-else-if="authors.length" class="space-y-0.5">
        <li v-for="a in authors" :key="a.id">
          <NuxtLink
            :to="{ path: '/', query: { author: a.slug } }"
            class="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-subtle"
            :class="activeAuthorSlug === a.slug ? 'bg-surface-subtle ring-1 ring-edge-subtle' : ''"
          >
            <img :src="authorAvatarUrl(a)" :alt="a.name" width="28" height="28" loading="lazy"
              class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-edge-subtle">
            <span class="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-content">
              {{ a.name }}
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="py-4 text-center text-sm text-content-muted">
        {{ t('authors.none') }}
      </p>
    </div>

  </div>
</template>
