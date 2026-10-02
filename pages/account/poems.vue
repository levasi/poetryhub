<script setup lang="ts">
definePageMeta({ layout: 'account' })

const { t, locale } = useI18n()
const { user } = useAuth()

// Only poet accounts can access this page.
if (!user.value?.isPoet) {
  await navigateTo('/account')
}

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

interface UserDraft {
  id: string
  title: string
  authorName: string
  language: string
  updatedAt: string
  createdAt: string
}

const page = ref(1)
const deleting = ref<string | null>(null)
const deleteError = ref('')
const claimSlug = ref('')
const claimLoading = ref(false)
const claimError = ref('')
const claimOk = ref(false)

const draftsPage = ref(1)
const deletingDraft = ref<string | null>(null)
const draftsError = ref('')

const { data, refresh } = await useFetch<{ data: UserPoem[]; meta: { total: number; totalPages: number } }>(
  '/api/user/poems',
  { credentials: 'include', params: computed(() => ({ page: page.value, limit: 20 })) },
)

const { data: draftsRes, refresh: refreshDrafts } = await useFetch<{ data: UserDraft[]; meta: { total: number; totalPages: number } }>(
  '/api/user/drafts',
  { credentials: 'include', params: computed(() => ({ page: draftsPage.value, limit: 20 })) },
)

watch(page, () => refresh())
watch(draftsPage, () => refreshDrafts())

const poems = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)
const drafts = computed(() => draftsRes.value?.data ?? [])
const totalDraftPages = computed(() => draftsRes.value?.meta.totalPages ?? 1)

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
    await $fetch(`/api/user/poems/${slug}`, { method: 'DELETE', credentials: 'include' })
    refresh()
  } catch {
    deleteError.value = t('account.poemsDeleteError')
  } finally {
    deleting.value = null
  }
}

async function deleteDraft(id: string) {
  if (!confirm(t('account.draftsDeleteConfirm'))) return
  draftsError.value = ''
  deletingDraft.value = id
  try {
    await $fetch(`/api/user/drafts/${id}`, { method: 'DELETE', credentials: 'include' })
    await refreshDrafts()
  } catch {
    draftsError.value = t('account.draftsDeleteError')
  } finally {
    deletingDraft.value = null
  }
}

async function claimPoem() {
  const slug = claimSlug.value.trim()
  if (!slug || claimLoading.value) return
  claimLoading.value = true
  claimError.value = ''
  claimOk.value = false
  try {
    await $fetch('/api/user/poems/claim', { method: 'POST', credentials: 'include', body: { slug } })
    claimSlug.value = ''
    claimOk.value = true
    await refresh()
    setTimeout(() => {
      claimOk.value = false
    }, 1800)
  } catch {
    claimError.value = t('account.poemsClaimError')
  } finally {
    claimLoading.value = false
  }
}
</script>

<template>
  <div class="account-page">
    <header class="account-page__header account-page__header--bordered">
      <div>
        <p class="ds-eyebrow mb-2 text-brand">{{ t('account.title') }}</p>
        <h1 class="account-page__page-title account-page__page-title--lg">
          {{ t('account.poemsSection') }}
        </h1>
        <p class="account-page__page-desc account-page__page-desc--secondary">
          {{ t('account.poemsDesc') }}
        </p>
      </div>
    </header>

    <!-- Drafts -->
    <section class="account-page__section">
      <div class="account-page__section-head">
        <div>
          <h2 class="account-page__section-title">{{ t('account.draftsTitle') }}</h2>
          <p class="account-page__section-desc">{{ t('account.draftsDesc') }}</p>
        </div>
        <NuxtLink to="/write" class="ds-btn-secondary shrink-0">
          {{ t('account.draftsWriteLink') }}
        </NuxtLink>
      </div>

      <p v-if="draftsError" class="account-page__alert">
        {{ draftsError }}
      </p>

      <div v-if="!drafts.length" class="account-page__empty account-page__empty--drafts">
        <p class="account-page__section-desc">{{ t('account.draftsEmpty') }}</p>
      </div>
      <div v-else class="account-page__list">
        <div v-for="d in drafts" :key="d.id" class="account-page__list-item">
          <div class="account-page__list-main">
            <p class="account-page__list-title">{{ d.title }}</p>
            <p class="account-page__list-sub">
              {{ d.authorName }} · {{ d.language.toUpperCase() }}
            </p>
            <div class="account-page__list-meta">
              <span class="account-page__meta-date">{{ formatDate(d.updatedAt) }}</span>
            </div>
          </div>
          <div class="account-page__list-actions">
            <NuxtLink :to="{ path: '/write', query: { draft: d.id } }"
              class="account-page__list-action">
              {{ t('account.draftsEdit') }}
            </NuxtLink>
            <button type="button" :disabled="deletingDraft === d.id"
              class="account-page__list-action account-page__list-action--danger"
              @click="deleteDraft(d.id)">
              {{ deletingDraft === d.id ? t('account.draftsDeleting') : t('account.draftsDelete') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="totalDraftPages > 1" class="account-page__pagination">
        <PaginationNav :page="draftsPage" :total-pages="totalDraftPages" @update:page="(p) => { draftsPage = p }" />
      </div>
    </section>

    <p v-if="deleteError" class="account-page__alert">
      {{ deleteError }}
    </p>

    <div v-if="!poems.length" class="account-page__empty">
      <div class="account-page__empty-icon">
        <svg class="account-page__empty-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="account-page__empty-title">{{ t('account.poemsEmpty') }}</p>
      <NuxtLink to="/write" class="ds-btn-secondary">
        {{ t('account.poemsWriteLink') }}
      </NuxtLink>

      <div class="account-page__claim">
        <p class="account-page__claim-label">
          {{ t('account.poemsClaimTitle') }}
        </p>
        <div class="account-page__claim-row">
          <input v-model="claimSlug" type="text"
            class="account-page__claim-input"
            :placeholder="t('account.poemsClaimPlaceholder')" autocomplete="off" @keydown.enter.prevent="claimPoem" />
          <button type="button"
            class="account-page__claim-btn"
            :disabled="claimLoading || !claimSlug.trim()" @click="claimPoem">
            {{ claimLoading ? t('account.poemsClaiming') : t('account.poemsClaimBtn') }}
          </button>
        </div>
        <p v-if="claimError" class="account-page__claim-feedback account-page__claim-feedback--err">{{ claimError }}</p>
        <p v-else-if="claimOk" class="account-page__claim-feedback account-page__claim-feedback--ok">{{ t('account.poemsClaimOk') }}</p>
      </div>
    </div>

    <div v-else class="account-page__list">
      <div v-for="poem in poems" :key="poem.id" class="account-page__list-item">
        <div class="account-page__list-main">
          <NuxtLink :to="{ path: `/authors/${poem.author.slug}`, query: { poem: poem.slug } }"
            class="account-page__list-title account-page__list-title--link">
            {{ poem.title }}
          </NuxtLink>
          <p v-if="poem.excerpt" class="account-page__list-sub account-page__list-sub--clamp">
            {{ poem.excerpt }}
          </p>
          <div class="account-page__list-meta">
            <span class="account-page__meta-date">{{ formatDate(poem.createdAt) }}</span>
            <span v-for="pt in poem.poemTags.slice(0, 3)" :key="pt.tag.id" class="account-page__tag">
              {{ pt.tag.name }}
            </span>
          </div>
        </div>
        <div class="account-page__list-actions">
          <NuxtLink :to="{ path: `/authors/${poem.author.slug}`, query: { poem: poem.slug } }"
            class="account-page__list-action">
            {{ t('account.poemsViewPoem') }}
          </NuxtLink>
          <button type="button" :disabled="deleting === poem.slug"
            class="account-page__list-action account-page__list-action--danger"
            @click="deletePoem(poem.slug)">
            {{ deleting === poem.slug ? t('account.poemsDeleting') : t('account.poemsDeletePoem') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="account-page__pagination">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
