<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminDashboard')) })

// High-level stats
const { data: poemStats } = await useFetch('/api/poems', { params: { limit: 1 } })
const { data: authorStats } = await useFetch('/api/authors', { params: { limit: 1 } })
const { data: tags } = await useFetch('/api/tags')

const totalPoems = computed(() => (poemStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalAuthors = computed(() => (authorStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalTags = computed(() => (tags.value as unknown[])?.length ?? 0)

// ─── Poem date enrichment ─────────────────────────────────────────────────────
const enrichRunning = ref(false)
const enrichResult = ref<{ processed: number; enriched: number; errors: number; remaining: number; done: boolean } | null>(null)
const enrichError = ref('')

async function runEnrichBatch() {
  enrichRunning.value = true
  enrichError.value = ''
  try {
    const res = await $fetch<{ processed: number; enriched: number; errors: number; remaining: number; done: boolean }>(
      '/api/admin/enrich-poems',
      { method: 'POST', body: { batchSize: 5 } },
    )
    enrichResult.value = res
  } catch (err: unknown) {
    enrichError.value = (err as { data?: { message?: string } })?.data?.message ?? 'Unknown error'
  } finally {
    enrichRunning.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-8 font-serif text-3xl font-bold text-ink-900">{{ t('admin.dashboard') }}</h1>

    <!-- Stats cards -->
    <div class="mb-10 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.totalPoems') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-gold-700">{{ totalPoems }}</p>
      </div>
      <div class="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.authors') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-ink-900">{{ totalAuthors }}</p>
      </div>
      <div class="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-widest text-ink-500">{{ t('admin.stats.tags') }}</p>
        <p class="mt-2 font-serif text-4xl font-bold text-ink-900">{{ totalTags }}</p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink to="/admin/poems/new"
        class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/50">
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

      <NuxtLink to="/admin/authors/new"
        class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.newAuthor') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.newAuthorDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/import"
        class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/50">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.importPoems') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.importPoemsDesc') }}</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/" target="_blank"
        class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-ink-900">{{ t('admin.quick.viewSite') }}</p>
          <p class="text-xs text-ink-500">{{ t('admin.quick.viewSiteDesc') }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Poem date enrichment panel -->
    <div class="mt-10 rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-medium text-ink-900">{{ t('admin.enrich.title') }}</p>
          <p class="mt-0.5 text-sm text-ink-500">{{ t('admin.enrich.desc') }}</p>
        </div>
      </div>

      <!-- Result feedback -->
      <div v-if="enrichResult" class="mb-4 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700">
        <p v-if="enrichResult.done" class="font-medium text-emerald-700">✓ {{ t('admin.enrich.done') }}</p>
        <p v-else>
          {{ t('admin.enrich.result', {
            processed: enrichResult.processed, enriched: enrichResult.enriched, remaining:
              enrichResult.remaining
          }) }}
          <span v-if="enrichResult.errors > 0" class="ml-2 text-amber-600">· {{ t('admin.enrich.errorCount', {
            errors:
              enrichResult.errors
          }) }}</span>
        </p>
      </div>

      <!-- Error -->
      <p v-if="enrichError" class="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{{ enrichError }}</p>

      <button type="button" :disabled="enrichRunning || enrichResult?.done"
        class="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="runEnrichBatch">
        <svg v-if="enrichRunning" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ enrichRunning ? t('admin.enrich.running') : t('admin.enrich.btn') }}
      </button>
    </div>
  </div>
</template>
