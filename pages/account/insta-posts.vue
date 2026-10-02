<script setup lang="ts">
definePageMeta({ layout: 'account' })

const { t, locale } = useI18n()

useSeoMeta({ title: computed(() => `${t('account.instaPostsSection')} — PoetryHub`) })

interface SavedInstaPost {
  id: string
  title: string
  authorName: string
  poemSlug?: string | null
  updatedAt: string
  createdAt: string
}

const page = ref(1)
const deleting = ref<string | null>(null)
const deleteError = ref('')

const { data, refresh } = await useFetch<{ data: SavedInstaPost[]; meta: { total: number; totalPages: number } }>(
  '/api/user/insta-posts',
  { credentials: 'include', params: computed(() => ({ page: page.value, limit: 20 })) },
)

watch(page, () => refresh())

const posts = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function deletePost(id: string) {
  if (!confirm(t('account.instaPostsDeleteConfirm'))) return
  deleteError.value = ''
  deleting.value = id
  try {
    await $fetch(`/api/user/insta-posts/${id}`, { method: 'DELETE', credentials: 'include' })
    await refresh()
  } catch {
    deleteError.value = t('account.instaPostsDeleteError')
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="account-page">
    <header class="account-page__header">
      <h1 class="account-page__page-title">
        {{ t('account.instaPostsSection') }}
      </h1>
      <p class="account-page__page-desc">
        {{ t('account.instaPostsDesc') }}
      </p>
    </header>

    <p v-if="deleteError" class="account-page__alert account-page__alert--plain" role="alert">
      {{ deleteError }}
    </p>

    <div v-if="posts.length" class="account-page__list">
      <article
        v-for="post in posts"
        :key="post.id"
        class="account-page__list-item account-page__list-item--insta"
      >
        <div class="account-page__list-main">
          <h2 class="account-page__list-title account-page__list-title--serif">
            {{ post.title }}
          </h2>
          <p class="account-page__list-sub account-page__list-sub--muted">
            {{ post.authorName }}
            <span v-if="post.poemSlug" class="account-page__soft"> · {{ post.poemSlug }}</span>
          </p>
          <p class="account-page__meta-date account-page__meta-date--mt">
            {{ formatDate(post.updatedAt) }}
          </p>
        </div>
        <div class="account-page__list-actions account-page__list-actions--wrap">
          <NuxtLink
            :to="{ path: '/carousel-generator', query: { saved: post.id } }"
            class="ds-btn-secondary ds-btn--sm"
          >
            {{ t('account.instaPostsEdit') }}
          </NuxtLink>
          <button
            type="button"
            class="ds-btn-secondary ds-btn--sm ds-btn--danger"
            :disabled="deleting === post.id"
            @click="deletePost(post.id)"
          >
            {{ deleting === post.id ? t('account.instaPostsDeleting') : t('account.instaPostsDelete') }}
          </button>
        </div>
      </article>

      <div v-if="totalPages > 1" class="account-page__pagination account-page__pagination--center">
        <button type="button" class="ds-btn-secondary ds-btn--xs" :disabled="page <= 1" @click="page--">
          ‹
        </button>
        <span class="account-page__page-num">{{ page }} / {{ totalPages }}</span>
        <button type="button" class="ds-btn-secondary ds-btn--xs" :disabled="page >= totalPages" @click="page++">
          ›
        </button>
      </div>
    </div>

    <div v-else class="account-page__empty account-page__empty--dashed-subtle">
      <p class="account-page__empty-title">
        {{ t('account.instaPostsEmpty') }}
      </p>
      <NuxtLink to="/carousel-generator" class="ds-link ds-link--sm">
        {{ t('account.instaPostsOpenGenerator') }}
      </NuxtLink>
    </div>
  </div>
</template>
