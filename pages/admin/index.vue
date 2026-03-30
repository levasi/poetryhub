<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminDashboard')) })

// High-level stats
const { data: poemStats }   = await useFetch('/api/poems',   { params: { limit: 1 } })
const { data: authorStats } = await useFetch('/api/authors', { params: { limit: 1 } })
const { data: tags }        = await useFetch('/api/tags')

const totalPoems   = computed(() => (poemStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalAuthors = computed(() => (authorStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalTags    = computed(() => (tags.value as unknown[])?.length ?? 0)
</script>

<template>
  <div>
    <h1 class="mb-8 font-serif text-3xl font-bold text-ink-900">{{ t('admin.dashboard') }}</h1>

    <!-- Stats cards -->
    <div class="mb-10 grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.totalPoems') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-gold-700">{{ totalPoems }}</p>
      </div>
      <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.authors') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-ink-900">{{ totalAuthors }}</p>
      </div>
      <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.tags') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-ink-900">{{ totalTags }}</p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        to="/admin/poems/new"
        class="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.newPoem') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.newPoemDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/admin/authors/new"
        class="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.newAuthor') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.newAuthorDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/admin/import"
        class="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.importPoems') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.importPoemsDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/poems"
        target="_blank"
        class="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.viewSite') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.viewSiteDesc') }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
