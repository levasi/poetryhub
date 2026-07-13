<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { authorAvatarUrl } from '~/utils/authorAvatar'

const props = withDefaults(
  defineProps<{
    variant?: 'sidebar' | 'shelf'
  }>(),
  { variant: 'sidebar' },
)

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
    <div
      v-if="variant === 'sidebar'"
      class="mb-3 flex items-center justify-between gap-2 px-1"
    >
      <p class="text-ui-xs font-semibold uppercase tracking-wider text-content-soft">
        {{ t('home.sidebarAuthorsHeading') }}
      </p>
      <NuxtLink
        to="/descopera"
        class="text-ui-xs font-medium text-brand hover:text-brand-hover"
      >
        {{ t('nav.allAuthors') }}
      </NuxtLink>
    </div>
    <p
      v-else
      class="mb-3 px-1 text-ui-xs font-semibold uppercase tracking-wider text-content-soft"
    >
      {{ t('home.sidebarAuthorsHeading') }}
    </p>

    <div
      v-if="variant === 'sidebar'"
      class="relative mb-3"
    >
      <Icon
        icon="heroicons:magnifying-glass"
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-hint"
        aria-hidden="true"
      />
      <input
        v-model="search"
        type="search"
        autocomplete="off"
        :placeholder="t('authors.searchPlaceholder')"
        class="w-full rounded-full border-0 bg-surface-subtle py-2 pl-9 pr-3 text-sm text-content placeholder:text-content-hint outline-none ring-1 ring-transparent transition-shadow focus:ring-2 focus:ring-brand/35"
      >
    </div>

    <div :aria-busy="pending">
      <div
        v-if="pending"
        class="flex justify-center py-8"
        role="status"
      >
        <span
          class="h-7 w-7 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
          aria-hidden="true"
        />
      </div>

      <!-- Horizontal shelf (mobile / tablet) -->
      <div
        v-else-if="variant === 'shelf' && authors.length"
        class="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        <NuxtLink
          v-for="a in authors.slice(0, 24)"
          :key="a.id"
          :to="{ path: '/descopera', query: { author: a.slug } }"
          class="inline-flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
          :class="activeAuthorSlug === a.slug
            ? 'border-brand/40 bg-brand-tint text-content'
            : 'border-edge-subtle bg-surface-raised text-content-secondary hover:border-edge'"
        >
          <img
            :src="authorAvatarUrl(a)"
            :alt="a.name"
            width="28"
            height="28"
            loading="lazy"
            class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-edge-subtle"
          >
          <span class="max-w-[8rem] truncate text-ui-sm font-medium">{{ a.name }}</span>
        </NuxtLink>
      </div>

      <!-- Vertical sidebar (desktop rail) -->
      <ul
        v-else-if="variant === 'sidebar' && authors.length"
        class="space-y-0.5"
      >
        <li
          v-for="a in authors"
          :key="a.id"
        >
          <NuxtLink
            :to="{ path: '/descopera', query: { author: a.slug } }"
            class="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-subtle"
            :class="activeAuthorSlug === a.slug ? 'bg-brand-tint ring-1 ring-brand/30' : ''"
          >
            <img
              :src="authorAvatarUrl(a)"
              :alt="a.name"
              width="28"
              height="28"
              loading="lazy"
              class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-edge-subtle"
            >
            <span class="min-w-0 flex-1 truncate font-serif text-[13px] font-medium leading-tight text-content">
              {{ a.name }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <p
        v-else-if="!authors.length"
        class="py-4 text-center text-sm text-content-muted"
      >
        {{ t('authors.none') }}
      </p>
    </div>
  </div>
</template>
