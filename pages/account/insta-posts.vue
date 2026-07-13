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
  <div class="mx-auto max-w-3xl">
    <header class="mb-8">
      <h1 class="font-serif text-2xl font-semibold tracking-tight text-content md:text-3xl">
        {{ t('account.instaPostsSection') }}
      </h1>
      <p class="mt-2 text-sm leading-relaxed text-content-muted">
        {{ t('account.instaPostsDesc') }}
      </p>
    </header>

    <p v-if="deleteError" class="mb-4 text-sm text-danger" role="alert">
      {{ deleteError }}
    </p>

    <div v-if="posts.length" class="space-y-3">
      <article
        v-for="post in posts"
        :key="post.id"
        class="flex flex-col gap-3 rounded-ds-lg border border-edge-subtle bg-surface-raised p-4 shadow-ds-card sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <h2 class="truncate font-serif text-lg font-semibold text-content">
            {{ post.title }}
          </h2>
          <p class="mt-0.5 truncate text-sm text-content-muted">
            {{ post.authorName }}
            <span v-if="post.poemSlug" class="text-content-soft"> · {{ post.poemSlug }}</span>
          </p>
          <p class="mt-1 text-xs text-content-soft">
            {{ formatDate(post.updatedAt) }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <NuxtLink
            :to="{ path: '/carousel-generator', query: { saved: post.id } }"
            class="ds-btn-secondary px-3 py-2 text-sm"
          >
            {{ t('account.instaPostsEdit') }}
          </NuxtLink>
          <button
            type="button"
            class="ds-btn-secondary px-3 py-2 text-sm text-danger hover:bg-danger/5"
            :disabled="deleting === post.id"
            @click="deletePost(post.id)"
          >
            {{ deleting === post.id ? t('account.instaPostsDeleting') : t('account.instaPostsDelete') }}
          </button>
        </div>
      </article>

      <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-4">
        <button type="button" class="ds-btn-secondary px-3 py-1.5 text-sm" :disabled="page <= 1" @click="page--">
          ‹
        </button>
        <span class="self-center text-sm text-content-muted tabular-nums">{{ page }} / {{ totalPages }}</span>
        <button type="button" class="ds-btn-secondary px-3 py-1.5 text-sm" :disabled="page >= totalPages" @click="page++">
          ›
        </button>
      </div>
    </div>

    <div v-else class="rounded-ds-lg border border-dashed border-edge-subtle bg-surface-subtle/50 p-8 text-center">
      <p class="mb-3 font-medium text-content-secondary">
        {{ t('account.instaPostsEmpty') }}
      </p>
      <NuxtLink to="/carousel-generator" class="ds-link text-sm font-medium">
        {{ t('account.instaPostsOpenGenerator') }}
      </NuxtLink>
    </div>
  </div>
</template>
