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
  <div class="home-authors">
    <div
      v-if="variant === 'sidebar'"
      class="home-authors__header"
    >
      <p class="home-authors__heading">
        {{ t('home.sidebarAuthorsHeading') }}
      </p>
      <NuxtLink
        to="/descopera"
        class="home-authors__all"
      >
        {{ t('nav.allAuthors') }}
      </NuxtLink>
    </div>
    <p
      v-else
      class="home-authors__heading home-authors__heading--shelf"
    >
      {{ t('home.sidebarAuthorsHeading') }}
    </p>

    <div
      v-if="variant === 'sidebar'"
      class="home-authors__search"
    >
      <Icon
        icon="heroicons:magnifying-glass"
        class="home-authors__search-icon"
        aria-hidden="true"
      />
      <input
        v-model="search"
        type="search"
        autocomplete="off"
        :placeholder="t('authors.searchPlaceholder')"
        class="home-authors__search-input"
      >
    </div>

    <div :aria-busy="pending">
      <div
        v-if="pending"
        class="home-authors__pending"
        role="status"
      >
        <span
          class="home-authors__spinner"
          aria-hidden="true"
        />
      </div>

      <div
        v-else-if="variant === 'shelf' && authors.length"
        class="home-authors__shelf"
      >
        <NuxtLink
          v-for="a in authors.slice(0, 24)"
          :key="a.id"
          :to="{ path: '/descopera', query: { author: a.slug } }"
          class="home-authors__chip"
          :class="{ 'home-authors__chip--active': activeAuthorSlug === a.slug }"
        >
          <img
            :src="authorAvatarUrl(a)"
            :alt="a.name"
            width="28"
            height="28"
            loading="lazy"
            class="home-authors__avatar"
          >
          <span class="home-authors__chip-name">{{ a.name }}</span>
        </NuxtLink>
      </div>

      <ul
        v-else-if="variant === 'sidebar' && authors.length"
        class="home-authors__list"
      >
        <li
          v-for="a in authors"
          :key="a.id"
        >
          <NuxtLink
            :to="{ path: '/descopera', query: { author: a.slug } }"
            class="home-authors__link"
            :class="{ 'home-authors__link--active': activeAuthorSlug === a.slug }"
          >
            <img
              :src="authorAvatarUrl(a)"
              :alt="a.name"
              width="28"
              height="28"
              loading="lazy"
              class="home-authors__avatar"
            >
            <span class="home-authors__name">
              {{ a.name }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <p
        v-else-if="!authors.length"
        class="home-authors__empty"
      >
        {{ t('authors.none') }}
      </p>
    </div>
  </div>
</template>
