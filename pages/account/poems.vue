<script setup lang="ts">
definePageMeta({ layout: 'account' })

const { t, locale } = useI18n()

useSeoMeta({ title: computed(() => `${t('account.poemsSection')} — PoetryHub`) })

interface UserPoem {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  createdAt: string
  author: { name: string; slug: string }
  poemTags: { tag: { id: string; slug: string; name: string } }[]
}

const page = ref(1)
const deleting = ref<string | null>(null)
const deleteError = ref('')

const { data, refresh } = await useFetch<{ data: UserPoem[]; meta: { total: number; totalPages: number } }>(
  '/api/user/poems',
  { params: computed(() => ({ page: page.value, limit: 20 })) },
)

watch(page, () => refresh())

const poems = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function deletePoem(slug: string) {
  if (!confirm(t('account.poemsDeleteConfirm'))) return
  deleteError.value = ''
  deleting.value = slug
  try {
    await $fetch(`/api/user/poems/${slug}`, { method: 'DELETE' })
    refresh()
  } catch {
    deleteError.value = t('account.poemsDeleteError')
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <header class="mb-8 flex flex-col gap-4 border-b border-edge-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="ds-eyebrow mb-2 text-brand">{{ t('account.title') }}</p>
        <h1 class="font-serif text-3xl font-bold tracking-tight text-content md:text-4xl">
          {{ t('account.poemsSection') }}
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-content-secondary">
          {{ t('account.poemsDesc') }}
        </p>
      </div>
      <NuxtLink to="/write" class="ds-btn-primary shrink-0 self-start sm:self-auto">
        {{ t('write.publishBtn') }}
      </NuxtLink>
    </header>

    <!-- Error -->
    <p v-if="deleteError" class="mb-4 rounded-ds-md bg-danger/10 px-4 py-2.5 text-sm text-danger">
      {{ deleteError }}
    </p>

    <!-- Empty state -->
    <div
      v-if="!poems.length"
      class="rounded-ds-lg border border-dashed border-edge bg-surface-subtle/40 px-6 py-16 text-center"
    >
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft/30 text-brand">
        <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="mb-3 font-medium text-content-secondary">{{ t('account.poemsEmpty') }}</p>
      <NuxtLink to="/write" class="ds-btn-secondary inline-flex">
        {{ t('account.poemsWriteLink') }}
      </NuxtLink>
    </div>

    <!-- Poems list -->
    <div v-else class="space-y-3">
      <div
        v-for="poem in poems"
        :key="poem.id"
        class="flex items-start justify-between gap-4 rounded-ds-lg border border-edge-subtle bg-surface-raised p-5 shadow-ds-card transition hover:border-edge hover:shadow-ds-card-hover"
      >
        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/poems/${poem.slug}`"
            class="font-semibold text-content transition hover:text-brand"
          >
            {{ poem.title }}
          </NuxtLink>
          <p v-if="poem.excerpt" class="mt-0.5 line-clamp-2 text-sm text-content-secondary">
            {{ poem.excerpt }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span class="text-xs text-content-soft">{{ formatDate(poem.createdAt) }}</span>
            <span
              v-for="pt in poem.poemTags.slice(0, 3)"
              :key="pt.tag.id"
              class="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-content-secondary"
            >
              {{ pt.tag.name }}
            </span>
          </div>
        </div>
        <div class="flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
          <NuxtLink
            :to="`/poems/${poem.slug}`"
            class="rounded-ds-md px-3 py-2 text-center text-xs font-medium text-content-secondary transition hover:bg-surface-subtle hover:text-brand"
          >
            {{ t('account.poemsViewPoem') }}
          </NuxtLink>
          <button
            type="button"
            :disabled="deleting === poem.slug"
            class="rounded-ds-md px-3 py-2 text-xs font-medium text-content-secondary transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            @click="deletePoem(poem.slug)"
          >
            {{ deleting === poem.slug ? t('account.poemsDeleting') : t('account.poemsDeletePoem') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
