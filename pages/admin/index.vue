<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminDashboard')) })

const { data: poemStats } = await useFetch('/api/poems', { params: { limit: 1 } })
const { data: authorStats } = await useFetch('/api/authors', { params: { limit: 1 } })
const { data: tags } = await useFetch('/api/tags')

const totalPoems = computed(() => (poemStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalAuthors = computed(() => (authorStats.value as { meta: { total: number } })?.meta?.total ?? 0)
const totalTags = computed(() => (tags.value as unknown[])?.length ?? 0)

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

const quickLinks = computed(() => [
  { to: '/admin/poems/new', title: t('admin.quick.newPoem'), desc: t('admin.quick.newPoemDesc'), icon: 'M12 4v16m8-8H4' },
  { to: '/admin/authors/new', title: t('admin.quick.newAuthor'), desc: t('admin.quick.newAuthorDesc'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/admin/import', title: t('admin.quick.importPoems'), desc: t('admin.quick.importPoemsDesc'), icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { to: '/', title: t('admin.quick.viewSite'), desc: t('admin.quick.viewSiteDesc'), icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14', external: true },
])
</script>

<template>
<div class="admin-page">
    <h1 class="admin-page__header admin-page__header--dashboard admin-page__title admin-page__title--lg">
      {{ t('admin.dashboard') }}
    </h1>

    <div class="admin-page__stats">
      <div
        v-for="(stat, i) in [
          { label: t('admin.stats.totalPoems'), value: totalPoems, accent: true },
          { label: t('admin.stats.authors'), value: totalAuthors, accent: false },
          { label: t('admin.stats.tags'), value: totalTags, accent: false },
        ]"
        :key="i"
        class="ds-card admin-page__stat"
      >
        <p class="admin-page__stat-label">
          {{ stat.label }}
        </p>
        <p
          class="admin-page__stat-value"
          :class="stat.accent ? 'admin-page__stat-value--accent' : ''"
        >
          {{ stat.value }}
        </p>
      </div>
    </div>

    <div class="admin-page__links">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        :target="link.external ? '_blank' : undefined"
        class="ds-card-interactive admin-page__link-card"
      >
        <div class="admin-page__link-icon">
          <svg class="admin-page__link-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
          </svg>
        </div>
        <div class="admin-page__panel-body">
          <p class="admin-page__link-title">{{ link.title }}</p>
          <p class="admin-page__link-desc">{{ link.desc }}</p>
        </div>
      </NuxtLink>
    </div>

    <div class="ds-card admin-page__panel">
      <div class="admin-page__panel-head">
        <div class="admin-page__link-icon">
          <svg class="admin-page__link-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="admin-page__panel-body">
          <p class="admin-page__panel-title">{{ t('admin.enrich.title') }}</p>
          <p class="admin-page__panel-desc">{{ t('admin.enrich.desc') }}</p>
        </div>
      </div>

      <div
        v-if="enrichResult"
        class="admin-page__result"
      >
        <p v-if="enrichResult.done" class="admin-page__success-text">
          ✓ {{ t('admin.enrich.done') }}
        </p>
        <p v-else>
          {{ t('admin.enrich.result', {
            processed: enrichResult.processed,
            enriched: enrichResult.enriched,
            remaining: enrichResult.remaining,
          }) }}
          <span v-if="enrichResult.errors > 0" class="admin-page__danger-text">
            · {{ t('admin.enrich.errorCount', { errors: enrichResult.errors }) }}
          </span>
        </p>
      </div>

      <p v-if="enrichError" class="admin-page__error" style="margin-bottom:1rem">{{ enrichError }}</p>

      <button
        type="button"
        class="ds-btn-primary"
        :disabled="enrichRunning || enrichResult?.done"
        @click="runEnrichBatch"
      >
        <span
          v-if="enrichRunning"
          class="ph-spinner"
          aria-hidden="true"
        />
        {{ enrichRunning ? t('admin.enrich.running') : t('admin.enrich.btn') }}
      </button>
    </div>
  </div>
</template>
