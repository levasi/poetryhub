<script setup lang="ts">
import { $fetch as rawFetch } from 'ofetch'
import { displayNationality } from '~/utils/nationality'
import { SITE_OWNER_EMAIL } from '~/utils/roles'
import { isPoemEditorRoleOrSiteOwner, isStaffRole } from '~/utils/roles'
import type { Poem } from '~/composables/usePoems'

/** Matches GET /api/authors/:slug response shape. */
interface AuthorDetailPayload {
  author: {
    id: string
    name: string
    slug: string
    imageUrl: string | null
    bio: string | null
    nationality: string | null
    birthYear: number | null
    deathYear: number | null
  }
  works: { slug: string; title: string }[]
  poems: {
    meta: { page: number; limit: number; total: number; totalPages: number }
    data: Poem[]
  }
}

definePageMeta({
  layout: 'fullwidth',
})

const { t } = useI18n()
const { user } = useAuth()
const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const isSiteOwner = computed(
  () => user.value?.email?.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase(),
)

const deletingAuthor = ref(false)

async function deleteAuthor() {
  if (deletingAuthor.value) return
  if (!confirm(t('admin.authors.confirmDelete'))) return
  deletingAuthor.value = true
  try {
    await rawFetch(`/api/authors/${encodeURIComponent(slug)}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('admin.authors.updateFailed'))
  } finally {
    deletingAuthor.value = false
  }
}

/** Minimal pagination params — we only need author, works, and total count. */
const { data, error, refresh } = await useFetch<AuthorDetailPayload>(`/api/authors/${slug}`, {
  params: { page: 1, limit: 1 },
})

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: t('authors.notFound') })
}

const author = computed(() => data.value?.author)
const works = computed(() => data.value?.works ?? [])
const meta = computed(() => data.value?.poems.meta)

function poemQuerySlug(): string | null {
  const q = route.query.poem
  if (typeof q === 'string' && q.trim()) return q.trim()
  if (Array.isArray(q) && q[0]) return String(q[0]).trim()
  return null
}

const selectedSlug = ref<string | null>(null)

watch(
  () => [data.value?.works, route.query.poem] as const,
  () => {
    const list = data.value?.works ?? []
    if (!list.length) {
      selectedSlug.value = null
      return
    }
    const q = poemQuerySlug()
    if (q && list.some((w) => w.slug === q)) {
      selectedSlug.value = q
      return
    }
    selectedSlug.value = list[0]!.slug
  },
  { immediate: true },
)

const activePoem = ref<Poem | null>(null)
const poemPending = ref(false)
const poemLoadFailed = ref(false)

async function loadActivePoem(s: string | null) {
  if (!s) {
    activePoem.value = null
    poemLoadFailed.value = false
    return
  }
  poemPending.value = true
  poemLoadFailed.value = false
  try {
    activePoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(s)}`)
  } catch {
    activePoem.value = null
    poemLoadFailed.value = true
  } finally {
    poemPending.value = false
  }
}

watch(selectedSlug, loadActivePoem, { immediate: true })

function selectWork(workSlug: string) {
  router.replace({ query: { ...route.query, poem: workSlug } })
}

/** Scroll target for deep links from poem titles (`?poem=`). */
const activePoemPanelRef = ref<HTMLElement | null>(null)

function scrollPoemPanelIntoViewIfNeeded() {
  if (!import.meta.client) return
  const el = activePoemPanelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const topMargin = 88
  const bottomPad = 32
  const vh = window.innerHeight
  const fullyVisible = rect.top >= topMargin && rect.bottom <= vh - bottomPad
  if (fullyVisible) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(
  () => [poemPending.value, activePoem.value?.slug, route.query.poem] as const,
  () => {
    if (poemPending.value || !activePoem.value) return
    const q = poemQuerySlug()
    if (!q || activePoem.value.slug !== q) return
    nextTick(() => {
      requestAnimationFrame(() => scrollPoemPanelIntoViewIfNeeded())
    })
  },
  { flush: 'post' },
)

const config = useRuntimeConfig()
const ogImage = computed(() => author.value?.imageUrl || `${config.public.appUrl}/favicon.svg`)

useSeoMeta({
  title: computed(() => t('seo.authorTitle', { name: author.value?.name ?? '' })),
  description: computed(() => author.value?.bio ?? t('seo.authorDesc', { name: author.value?.name ?? '' })),
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
})

function yearsLabel() {
  const a = author.value
  if (!a) return ''
  if (a.birthYear && a.deathYear) return t('authors.lifeSpan', { birth: a.birthYear, death: a.deathYear })
  if (a.birthYear) return t('authors.born', { year: a.birthYear })
  return ''
}

const avatarSrc = computed(() =>
  author.value ? authorAvatarUrl(author.value) : '',
)

/** Moderator / admin / site owner — author bio & nationality on this page. */
const canEditCatalog = computed(() => isStaffRole(user.value?.role) || isSiteOwner.value)

/** Editor / moderator / admin / site owner — poem title & body in the reader panel. */
const canEditPoem = computed(() => isPoemEditorRoleOrSiteOwner(user.value?.role, user.value?.email))

function onPoemUpdated(updated: Poem) {
  activePoem.value = updated
  const entry = data.value?.works?.find((w) => w.slug === updated.slug)
  if (entry) entry.title = updated.title
}

const editingEthnicity = ref(false)
const ethnicityDraft = ref('')
const savingEthnicity = ref(false)

const editingBio = ref(false)
const bioDraft = ref('')
const savingBio = ref(false)

const nationalityLabel = computed(() => displayNationality(author.value?.nationality))

watch(
  author,
  (a) => {
    if (!a) return
    ethnicityDraft.value = a.nationality ?? ''
    if (!editingBio.value) bioDraft.value = a.bio ?? ''
  },
  { immediate: true },
)

function startEditEthnicity() {
  if (!author.value) return
  editingEthnicity.value = true
  ethnicityDraft.value = author.value.nationality ?? ''
}

function cancelEditEthnicity() {
  editingEthnicity.value = false
  ethnicityDraft.value = author.value?.nationality ?? ''
}

function startEditBio() {
  if (!author.value) return
  bioDraft.value = author.value.bio ?? ''
  editingBio.value = true
}

function cancelEditBio() {
  editingBio.value = false
  bioDraft.value = author.value?.bio ?? ''
}

async function saveBio() {
  if (!author.value || savingBio.value) return
  savingBio.value = true
  try {
    const updated = await rawFetch<AuthorDetailPayload['author']>(`/api/authors/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: { bio: bioDraft.value.trim() },
    })
    if (data.value?.author) Object.assign(data.value.author, updated)
    editingBio.value = false
    await refresh()
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('admin.authors.updateFailed'))
  } finally {
    savingBio.value = false
  }
}

async function saveEthnicity() {
  if (!author.value || savingEthnicity.value) return
  savingEthnicity.value = true
  try {
    const updated = await rawFetch(`/api/authors/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: { nationality: ethnicityDraft.value.trim() },
    })
    if (data.value?.author) {
      Object.assign(data.value.author, updated)
    }
    editingEthnicity.value = false
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('admin.authors.updateFailed'))
  } finally {
    savingEthnicity.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <div v-if="author" class="w-full min-w-0 px-4 pb-20 pt-2 md:px-8 md:pt-4 lg:px-10 xl:px-12">
      <!-- Author profile -->
      <div class="mb-12 flex flex-col items-start gap-6 sm:flex-row">
        <div class="shrink-0">
          <img :src="avatarSrc" :alt="author.name" loading="eager"
            class="h-24 w-24 rounded-full object-cover ring-2 ring-gold-300/60" />
        </div>

        <div>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 class="font-serif text-4xl font-bold text-content">{{ author.name }}</h1>
            <button v-if="isSiteOwner" type="button"
              class="shrink-0 rounded-md border border-danger/40 px-2 py-0.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
              :disabled="deletingAuthor" @click="deleteAuthor">
              {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
            </button>
          </div>
          <p class="mt-1 text-sm text-content-secondary">
            <template v-if="!editingEthnicity">
              <span v-if="nationalityLabel">{{ nationalityLabel }}</span>
              <span v-if="nationalityLabel && yearsLabel()"> · </span>
              <span>{{ yearsLabel() }}</span>
              <button v-if="canEditCatalog" type="button"
                class="ml-2 inline-flex items-center gap-1 rounded-lg border border-edge-subtle bg-surface-subtle px-2 py-1 text-xs font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised"
                @click="startEditEthnicity">
                {{ t('admin.authors.edit') }}
              </button>
            </template>
            <template v-else>
              <span class="sr-only">{{ t('admin.authors.nationality') }}</span>
              <input v-model="ethnicityDraft" type="text"
                class="mr-2 inline-flex w-[min(24rem,80vw)] rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                :placeholder="t('admin.authors.placeholderNationality')" />
              <button type="button"
                class="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
                :disabled="savingEthnicity" @click="saveEthnicity">
                {{ savingEthnicity ? t('admin.authors.saving') : t('admin.authors.save') }}
              </button>
              <button type="button"
                class="ml-2 inline-flex items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised disabled:opacity-50"
                :disabled="savingEthnicity" @click="cancelEditEthnicity">
                {{ t('admin.authors.cancel') }}
              </button>
              <span class="ml-2 text-sm text-content-secondary">{{ yearsLabel() }}</span>
            </template>
          </p>
          <p class="mt-3 text-sm text-content-muted">
            {{ t('authors.poemCount', meta?.total ?? 0) }}
          </p>
        </div>
      </div>

      <!-- Biography -->
      <section class="mb-10 pt-8">
        <div class="mb-3 flex flex-wrap items-center justify-start gap-3">
          <h2 class="font-serif text-xl font-bold text-content">{{ t('authors.biography') }}</h2>
          <button v-if="canEditCatalog && !editingBio" type="button"
            class="shrink-0 rounded-lg border border-edge-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised"
            @click="startEditBio">
            {{ t('authors.editBiography') }}
          </button>
        </div>
        <template v-if="editingBio">
          <textarea v-model="bioDraft" rows="14"
            class="max-w-3xl w-full rounded-ds-lg border border-edge-subtle bg-surface-page px-4 py-3 font-serif text-base leading-relaxed text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
              :disabled="savingBio" @click="saveBio">
              {{ savingBio ? t('authors.savingBio') : t('admin.authors.save') }}
            </button>
            <button type="button"
              class="inline-flex items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-2 text-sm font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised disabled:opacity-50"
              :disabled="savingBio" @click="cancelEditBio">
              {{ t('admin.authors.cancel') }}
            </button>
          </div>
        </template>
        <template v-else>
          <p v-if="author.bio" class="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-content-secondary">
            {{ author.bio }}
          </p>
          <p v-else class="max-w-3xl text-sm italic text-content-muted">{{ t('authors.bioUnavailable') }}</p>
        </template>
      </section>

      <!-- Bibliography + active poem -->
      <section v-if="works.length" class="pt-8">
        <h2 class="mb-3 font-serif text-xl font-bold text-content">{{ t('authors.bibliography') }}</h2>

        <div class="grid gap-10 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
          <!-- Left: bibliography -->
          <div class="flex min-h-0 flex-col lg:sticky lg:top-28 lg:max-h-[calc(100vh-7rem)]">
            <ul class="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 text-sm" role="listbox"
              :aria-label="t('authors.worksListAria')">
              <li v-for="w in works" :key="w.slug">
                <button type="button" role="option"
                  class="flex w-full items-center gap-2 rounded-ds-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
                  :class="selectedSlug === w.slug
                    ? 'border-brand/45 bg-surface-subtle text-content shadow-sm'
                    : 'border-transparent text-content-secondary hover:border-edge-subtle hover:bg-surface-subtle'"
                  :aria-selected="selectedSlug === w.slug" @click="selectWork(w.slug)">
                  <span class="min-w-0 flex-1 font-medium text-content">{{ w.title }}</span>
                  <PoemCarouselIcon :slug="w.slug" size="sm" class="shrink-0" />
                </button>
              </li>
            </ul>
          </div>

          <!-- Right: active poem (scroll target for ?poem= deep links) -->
          <div ref="activePoemPanelRef" class="min-w-0 scroll-mt-24 md:scroll-mt-28">
            <div
              class="rounded-ds-lg border border-edge-subtle bg-surface-raised/40 px-3 py-6 shadow-ds-card sm:px-5 md:px-8 md:py-10">
              <div v-if="poemPending" class="flex min-h-[16rem] items-center justify-center py-12">
                <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                  aria-hidden="true" />
              </div>
              <template v-else-if="activePoem">
                <PoetryViewer :poem="activePoem" :allow-poem-edit="canEditPoem" @poem-updated="onPoemUpdated" />
              </template>
              <p v-else-if="poemLoadFailed" class="text-center text-sm text-content-muted">
                {{ t('authors.poemCouldNotLoad') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div v-else class="border-t border-edge/80 py-16 text-center text-content-secondary">
        <p class="font-serif">{{ t('authors.noPoemsYet') }}</p>
      </div>
    </div>
  </div>
</template>
