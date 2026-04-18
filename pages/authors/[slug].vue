<script setup lang="ts">
import { $fetch as rawFetch } from 'ofetch'
import { displayNationality } from '~/utils/nationality'
import { SITE_OWNER_EMAIL } from '~/utils/roles'
import { isPoemEditorRoleOrSiteOwner, normalizeRole } from '~/utils/roles'
import type { Poem } from '~/composables/usePoems'
import { PAGE_SHELL_INSET_CLASS } from '~/utils/pageShell'

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

/** Bump after saves so GET bypasses Nitro/client dedupe for the same URL + params. */
const authorFetchNonce = ref(0)

/** Minimal pagination params — we only need author, works, and total count. */
const { data, error, refresh } = await useFetch<AuthorDetailPayload>(`/api/authors/${slug}`, {
  params: computed(() => ({
    page: 1,
    limit: 1,
    _hub: authorFetchNonce.value,
  })),
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

/** Editor / moderator / admin / site owner — author name, bio & nationality on this page. */
const canEditCatalog = computed(() => isPoemEditorRoleOrSiteOwner(user.value?.role, user.value?.email))

/** Administrators only (`User.role === 'admin'`) — portrait file upload on this page. */
const canUploadPortraitAsAdmin = computed(() => normalizeRole(user.value?.role) === 'admin')

/** Editor / moderator / admin / site owner — poem title & body in the reader panel. */
const canEditPoem = computed(() => isPoemEditorRoleOrSiteOwner(user.value?.role, user.value?.email))

function onPoemUpdated(updated: Poem) {
  activePoem.value = updated
  const entry = data.value?.works?.find((w) => w.slug === updated.slug)
  if (entry) entry.title = updated.title
}

/** Single edit mode for the whole author profile (triggered by floating edit FAB). */
const authorEditMode = ref(false)
const nameDraft = ref('')
const ethnicityDraft = ref('')
const bioDraft = ref('')
const imageUrlDraft = ref('')
const birthYearDraft = ref('')
const deathYearDraft = ref('')

const nationalityLabel = computed(() => displayNationality(author.value?.nationality))

function syncDraftsFromAuthor() {
  const a = author.value
  if (!a) return
  nameDraft.value = a.name
  ethnicityDraft.value = a.nationality ?? ''
  bioDraft.value = a.bio ?? ''
  imageUrlDraft.value = a.imageUrl ?? ''
  birthYearDraft.value = a.birthYear != null ? String(a.birthYear) : ''
  deathYearDraft.value = a.deathYear != null ? String(a.deathYear) : ''
}

watch(
  author,
  () => {
    if (!authorEditMode.value) syncDraftsFromAuthor()
  },
  { immediate: true },
)

function openAuthorEdit() {
  if (!author.value) return
  syncDraftsFromAuthor()
  authorEditMode.value = true
}

function cancelAuthorEdit() {
  authorEditMode.value = false
  syncDraftsFromAuthor()
}

/** Empty → null; invalid range → `'invalid'`. */
function parseYearField(raw: string): number | null | 'invalid' {
  const s = raw.trim()
  if (!s) return null
  const n = Number.parseInt(s, 10)
  if (!Number.isFinite(n) || n < 1000 || n > 2100) return 'invalid'
  return n
}

/** Persist author draft to API; updates local state. Does not exit edit mode or refresh. */
async function persistAuthorDrafts(): Promise<boolean> {
  if (!author.value) return false
  const nameTrim = nameDraft.value.trim()
  if (!nameTrim) {
    alert(t('admin.authors.nameRequiredError'))
    return false
  }
  const by = parseYearField(birthYearDraft.value)
  const dy = parseYearField(deathYearDraft.value)
  if (by === 'invalid' || dy === 'invalid') {
    alert(t('authors.invalidYear'))
    return false
  }
  /** Portrait: https URL, `data:image/…` from upload, or empty — validated on server (`PUT /api/authors/:slug`). */
  const urlTrim = imageUrlDraft.value.trim()

  try {
    const updated = await rawFetch<AuthorDetailPayload['author']>(`/api/authors/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: {
        name: nameTrim,
        bio: bioDraft.value.trim(),
        nationality: ethnicityDraft.value.trim(),
        imageUrl: urlTrim,
        birthYear: by,
        deathYear: dy,
      },
    })
    if (data.value?.author) Object.assign(data.value.author, updated)
    if (activePoem.value?.author?.id === updated.id) {
      activePoem.value = {
        ...activePoem.value,
        author: { ...activePoem.value.author, name: updated.name },
      }
    }
    return true
  } catch (err: unknown) {
    let msg = ''
    if (err && typeof err === 'object') {
      const e = err as {
        data?: { statusMessage?: string }
        statusMessage?: string
      }
      msg =
        String(e.data?.statusMessage ?? e.statusMessage ?? '').trim() ||
        (typeof (err as { message?: unknown }).message === 'string'
          ? String((err as { message: string }).message)
          : '')
    }
    alert(msg || t('admin.authors.updateFailed'))
    return false
  }
}

const savingEdits = ref(false)

/** Save author profile and current poem (if any), then exit edit mode. */
async function saveAllEdits() {
  if (savingEdits.value) return
  savingEdits.value = true
  try {
    if (!(await persistAuthorDrafts())) return
    await poetryViewerRef.value?.savePoemEdit?.()
    authorEditMode.value = false
    authorFetchNonce.value += 1
    await refresh({ dedupe: 'cancel' })
  } finally {
    savingEdits.value = false
  }
}

function discardAllEdits() {
  poetryViewerRef.value?.cancelPoemEdit?.()
  cancelAuthorEdit()
}

function onAuthorEditFabClick() {
  if (authorEditMode.value) {
    discardAllEdits()
  } else {
    openAuthorEdit()
  }
}

/** Below PoetryViewer reading-settings cog when a poem is open; otherwise vertically centered. */
const authorEditFabPositionClass = computed(() =>
  activePoem.value
    ? 'top-[calc(50%+3.5rem)] -translate-y-1/2'
    : 'top-1/2 -translate-y-1/2',
)

const poetryViewerRef = ref<{ savePoemEdit: () => Promise<void>; cancelPoemEdit: () => void } | null>(null)

const portraitFileInputRef = ref<HTMLInputElement | null>(null)
const uploadingPortrait = ref(false)

async function compressImageForPortrait(file: File, maxDim: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const w = bmp.width
  const h = bmp.height
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const tw = Math.round(w * scale)
  const th = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bmp.close()
    throw new Error('canvas')
  }
  ctx.drawImage(bmp, 0, 0, tw, th)
  bmp.close()
  const out = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', quality)
  })
  return out
}

async function onPortraitFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file?.type.startsWith('image/')) {
    alert(t('authors.portraitUploadInvalid'))
    return
  }
  uploadingPortrait.value = true
  try {
    let blob: Blob = file
    try {
      if (file.size > 900_000) {
        blob = await compressImageForPortrait(file, 1200, 0.88)
      }
      if (blob.size > 2 * 1024 * 1024) {
        blob = await compressImageForPortrait(file, 960, 0.82)
      }
    } catch {
      alert(t('authors.portraitUploadDecodeFailed'))
      return
    }
    const fd = new FormData()
    fd.append('file', blob, 'portrait.jpg')
    const updated = await rawFetch<AuthorDetailPayload['author']>(
      `/api/authors/${encodeURIComponent(slug)}/portrait`,
      {
        method: 'POST',
        body: fd,
        credentials: 'include',
      },
    )
    if (data.value?.author) Object.assign(data.value.author, updated)
    imageUrlDraft.value = updated.imageUrl ?? ''
    authorFetchNonce.value += 1
    await refresh({ dedupe: 'cancel' })
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'statusCode' in err ? (err as { statusCode?: number }).statusCode : undefined
    const msg =
      code === 403
        ? t('authors.portraitUploadForbidden')
        : code === 401
          ? t('authors.portraitUploadUnauthorized')
          : ''
    alert(msg || t('authors.portraitUploadFailed'))
  } finally {
    uploadingPortrait.value = false
  }
}

/** Read mode: clamp long bios and offer expand / collapse. */
const bioExpanded = ref(false)
const bioReadRef = ref<HTMLElement | null>(null)
const bioToggleVisible = ref(false)

function measureBioClamp() {
  if (!import.meta.client) return
  const el = bioReadRef.value
  const text = author.value?.bio?.trim()
  if (!el || !text || authorEditMode.value) {
    bioToggleVisible.value = false
    return
  }
  if (bioExpanded.value) {
    bioToggleVisible.value = true
    return
  }
  bioToggleVisible.value = el.scrollHeight > el.clientHeight + 2
}

watch(
  () =>
    [author.value?.bio, author.value?.id, bioExpanded.value, authorEditMode.value] as const,
  () => nextTick(() => requestAnimationFrame(measureBioClamp)),
  { flush: 'post' },
)

watch(
  () => route.params.slug as string,
  () => {
    bioExpanded.value = false
  },
)

onMounted(() => {
  nextTick(() => requestAnimationFrame(measureBioClamp))
  window.addEventListener('resize', measureBioClamp)
})

onBeforeUnmount(() => window.removeEventListener('resize', measureBioClamp))
</script>

<template>
  <div class="animate-fade-in">
    <!-- Floating author edit (same style as poem reading settings; below it when a poem is open) -->
    <button v-if="canEditCatalog && author" type="button"
      class="fixed right-3 z-[44] flex h-11 w-11 items-center justify-center rounded-full border border-edge-subtle bg-surface-raised/95 text-content-secondary shadow-ds-card backdrop-blur-sm transition hover:border-brand/45 hover:text-brand md:right-6"
      :class="[authorEditFabPositionClass, authorEditMode ? 'border-brand/50 text-brand ring-2 ring-brand/25' : '']"
      :aria-label="authorEditMode ? t('authors.exitAuthorEdit') : t('authors.openAuthorEdit')"
      :disabled="savingEdits || deletingAuthor" @click="onAuthorEditFabClick">
      <svg v-if="!authorEditMode" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div v-if="author" class="w-full min-w-0 pt-2 md:pt-4"
      :class="authorEditMode ? 'pb-32 md:pb-36' : 'pb-20'">
      <!-- Author profile -->
      <div class="mb-12 flex flex-col items-start gap-6 sm:flex-row">
        <div class="shrink-0">
          <img :src="avatarSrc" :alt="author.name" loading="eager"
            class="h-24 w-24 rounded-full object-cover ring-2 ring-gold-300/60" />
        </div>

        <div class="min-w-0 flex-1">
          <template v-if="!authorEditMode">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 class="font-serif text-4xl font-bold text-content">{{ author.name }}</h1>
              <button v-if="isSiteOwner" type="button"
                class="shrink-0 rounded-md border border-danger/40 px-2 py-0.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
                :disabled="deletingAuthor" @click="deleteAuthor">
                {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
              </button>
            </div>
            <p class="mt-1 text-sm text-content-secondary">
              <span v-if="nationalityLabel">{{ nationalityLabel }}</span>
              <span v-if="nationalityLabel && yearsLabel()"> · </span>
              <span>{{ yearsLabel() }}</span>
            </p>
          </template>

          <template v-else>
            <div class="max-w-3xl space-y-5">
              <div>
                <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
                  {{ t('admin.authors.name') }}
                </label>
                <input v-model="nameDraft" type="text" maxlength="200"
                  class="w-full rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 font-serif text-2xl font-bold text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:text-3xl md:text-4xl"
                  :placeholder="t('admin.authors.placeholderName')" autocomplete="off" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
                  {{ t('admin.authors.nationality') }}
                </label>
                <input v-model="ethnicityDraft" type="text"
                  class="w-full max-w-xl rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  :placeholder="t('admin.authors.placeholderNationality')" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
                  {{ t('admin.authors.photoUrl') }}
                </label>
                <input v-model="imageUrlDraft" type="text"
                  class="w-full rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  :placeholder="t('authors.portraitUrlPlaceholder')" autocomplete="off" spellcheck="false" />
              </div>
              <div v-if="canUploadPortraitAsAdmin" class="rounded-xl border border-edge-subtle bg-surface-subtle/60 p-4">
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-content-muted">
                  {{ t('authors.portraitUploadLabel') }}
                </p>
                <input ref="portraitFileInputRef" type="file" accept="image/*,.heic,.heif" class="sr-only"
                  @change="onPortraitFileSelected" />
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button"
                    class="rounded-lg border border-edge bg-surface-raised px-4 py-2 text-sm font-medium text-content transition hover:border-brand/40 disabled:opacity-50"
                    :disabled="uploadingPortrait" @click="portraitFileInputRef?.click()">
                    {{ uploadingPortrait ? t('authors.portraitUploading') : t('authors.portraitUploadPick') }}
                  </button>
                  <span class="text-xs text-content-muted">{{ t('authors.portraitUploadAdminOnly') }}</span>
                </div>
                <p class="mt-2 text-xs leading-relaxed text-content-muted">
                  {{ t('authors.portraitUploadHint') }}
                </p>
              </div>
              <div class="flex flex-wrap gap-6">
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
                    {{ t('admin.authors.birthYear') }}
                  </label>
                  <input v-model="birthYearDraft" type="text" inputmode="numeric" maxlength="4"
                    class="w-28 rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
                    {{ t('admin.authors.deathYear') }}
                  </label>
                  <input v-model="deathYearDraft" type="text" inputmode="numeric" maxlength="4"
                    class="w-28 rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
              <p class="text-xs text-content-muted">{{ t('authors.profileDetailsHint') }}</p>
              <button v-if="isSiteOwner" type="button"
                class="rounded-md border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
                :disabled="deletingAuthor" @click="deleteAuthor">
                {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
              </button>
            </div>
          </template>

          <p class="mt-3 text-sm text-content-muted">
            {{ t('authors.poemCount', meta?.total ?? 0) }}
          </p>
        </div>
      </div>

      <!-- Biography -->
      <section class="mb-10">
        <h2 class="mb-3 font-serif text-xl font-bold text-content">{{ t('authors.biography') }}</h2>
        <template v-if="authorEditMode">
          <textarea v-model="bioDraft" rows="14"
            class="max-w-3xl w-full rounded-ds-lg border border-edge-subtle bg-surface-page px-4 py-3 font-serif text-base leading-relaxed text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        </template>
        <template v-else>
          <div v-if="author.bio" class="max-w-3xl">
            <p ref="bioReadRef"
              class="whitespace-pre-wrap text-base leading-relaxed text-content-secondary"
              :class="{ 'line-clamp-6': !bioExpanded }">
              {{ author.bio }}
            </p>
            <button v-if="bioToggleVisible && !authorEditMode" type="button"
              class="mt-3 inline-flex items-center rounded-lg border border-edge-subtle bg-surface-subtle px-3 py-1.5 text-sm font-medium text-brand transition hover:border-brand/45 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
              :aria-expanded="bioExpanded"
              @click="bioExpanded = !bioExpanded">
              {{ bioExpanded ? t('authors.biographyCollapse') : t('authors.biographyExpand') }}
            </button>
          </div>
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
                <PoetryViewer ref="poetryViewerRef" :poem="activePoem" :allow-poem-edit="canEditPoem && authorEditMode"
                  :auto-poem-edit="canEditPoem && authorEditMode" :show-poem-edit-toolbar="false"
                  @poem-updated="onPoemUpdated" />
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

    <!-- Unified save / discard — fixed to viewport -->
    <div v-if="authorEditMode && author"
      class="fixed inset-x-0 bottom-0 z-[60] border-t border-edge-subtle bg-surface-raised/98 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div :class="[PAGE_SHELL_INSET_CLASS, 'flex flex-wrap items-center justify-center gap-2']">
        <button type="button"
          class="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50 sm:max-w-xs sm:flex-none"
          :disabled="savingEdits" @click="saveAllEdits">
          {{ savingEdits ? t('admin.authors.saving') : t('authors.saveAuthorChanges') }}
        </button>
        <button type="button"
          class="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-5 py-2.5 text-sm font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised disabled:opacity-50 sm:max-w-xs sm:flex-none"
          :disabled="savingEdits" @click="discardAllEdits">
          {{ t('authors.discardEdits') }}
        </button>
      </div>
    </div>
  </div>
</template>
