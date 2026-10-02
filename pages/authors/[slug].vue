<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { $fetch as rawFetch } from 'ofetch'
import { displayNationality } from '~/utils/nationality'
import { SITE_OWNER_EMAIL } from '~/utils/roles'
import { isPoemEditorRoleOrSiteOwner, normalizeRole } from '~/utils/roles'
import type { Poem } from '~/composables/usePoems'
import { PAGE_SHELL_INSET_CLASS, AUTHOR_EDIT_BAR_CLEARANCE } from '~/utils/pageShell'
import { getFetchErrorDataCode, getFetchErrorMessage, getFetchErrorStatus } from '~/utils/fetchApiError'

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

/** Bibliography “add poem” — administrators and editors only (not moderator). */
const canAddPoemFromBibliography = computed(() => {
  const r = normalizeRole(user.value?.role)
  return r === 'admin' || r === 'editor'
})

function onPoemUpdated(updated: Poem) {
  activePoem.value = {
    ...updated,
    navigation: activePoem.value?.navigation ?? updated.navigation,
  }
  const entry = data.value?.works?.find((w) => w.slug === updated.slug)
  if (entry) entry.title = updated.title
  authorFetchNonce.value += 1
  void refresh()
}

/** Single edit mode for the whole author profile (triggered by floating edit FAB). */
const authorEditMode = ref(false)
const readingSettingsOpen = useState('reading-settings-open', () => false)
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

/** Above mobile tab bar when a poem is open; otherwise vertically centered. */
const authorEditFabClass = computed(() => [
  activePoem.value ? 'author-page__edit-fab--poem-open' : '',
  authorEditMode.value ? 'author-page__edit-fab--active' : '',
])

const authorPageBodyClass = computed(() => {
  if (authorEditMode.value) return AUTHOR_EDIT_BAR_CLEARANCE
  if (activePoem.value) return 'author-page__body--poem-open'
  return ''
})

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

let addPoemModalEscapeHandler: ((e: KeyboardEvent) => void) | null = null

onMounted(() => {
  nextTick(() => requestAnimationFrame(measureBioClamp))
  window.addEventListener('resize', measureBioClamp)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureBioClamp)
  if (addPoemModalEscapeHandler) {
    window.removeEventListener('keydown', addPoemModalEscapeHandler)
    addPoemModalEscapeHandler = null
  }
})

const addPoemModalOpen = ref(false)
const newPoemTitle = ref('')
const newPoemContent = ref('')
const creatingPoem = ref(false)
const createPoemError = ref('')

function openAddPoemModal() {
  newPoemTitle.value = ''
  newPoemContent.value = ''
  createPoemError.value = ''
  addPoemModalOpen.value = true
}

function closeAddPoemModal() {
  if (creatingPoem.value) return
  addPoemModalOpen.value = false
}

function onAddPoemModalBackdropClick() {
  closeAddPoemModal()
}

watch(addPoemModalOpen, (open) => {
  if (!import.meta.client) return
  if (addPoemModalEscapeHandler) {
    window.removeEventListener('keydown', addPoemModalEscapeHandler)
    addPoemModalEscapeHandler = null
  }
  if (open) {
    addPoemModalEscapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAddPoemModal()
    }
    window.addEventListener('keydown', addPoemModalEscapeHandler)
  }
})

/** Title matches another work for this author (case-insensitive); shown inline in add-poem modal. */
const newPoemTitleLooksDuplicate = computed(() => {
  const raw = newPoemTitle.value.trim()
  if (!raw) return false
  const lc = raw.toLowerCase()
  return works.value.some((w) => w.title.trim().toLowerCase() === lc)
})

watch([newPoemTitle, newPoemContent], () => {
  createPoemError.value = ''
})

async function submitNewPoemFromModal() {
  const a = author.value
  if (!a || creatingPoem.value) return
  const title = newPoemTitle.value.trim()
  const content = newPoemContent.value.trim()
  if (!title || !content) {
    createPoemError.value = t('admin.poemForm.requiredFields')
    return
  }
  const titleLc = title.toLowerCase()
  if (works.value.some((w) => w.title.trim().toLowerCase() === titleLc)) {
    createPoemError.value = t('authors.duplicatePoemTitle')
    return
  }
  creatingPoem.value = true
  createPoemError.value = ''
  try {
    const poem = await $fetch<{ slug: string }>('/api/poems', {
      method: 'POST',
      credentials: 'include',
      body: {
        title,
        content,
        authorId: a.id,
        language: 'ro',
        source: 'classic',
        featured: false,
        tagIds: [],
      },
    })
    addPoemModalOpen.value = false
    newPoemTitle.value = ''
    newPoemContent.value = ''
    authorFetchNonce.value += 1
    await refresh({ dedupe: 'cancel' })
    await router.replace({ query: { ...route.query, poem: poem.slug } })
  } catch (err: unknown) {
    const statusCode = getFetchErrorStatus(err)
    const code = getFetchErrorDataCode(err)
    if (statusCode === 409 || code === 'DUPLICATE_POEM_TITLE') {
      createPoemError.value = t('authors.duplicatePoemTitle')
    } else {
      createPoemError.value = getFetchErrorMessage(err) ?? t('admin.poemForm.createFailed')
    }
  } finally {
    creatingPoem.value = false
  }
}
</script>

<template>
  <div class="author-page">
    <!-- Floating author edit (same style as poem reading settings; below it when a poem is open) -->
    <button
      v-if="canEditCatalog && author && !readingSettingsOpen"
      type="button"
      class="author-page__edit-fab"
      :class="authorEditFabClass"
      :aria-label="authorEditMode ? t('authors.exitAuthorEdit') : t('authors.openAuthorEdit')"
      :disabled="savingEdits || deletingAuthor"
      @click="onAuthorEditFabClick"
    >
      <Icon
        v-if="!authorEditMode"
        icon="heroicons:pencil-square"
        class="author-page__edit-icon"
        aria-hidden="true"
      />
      <Icon
        v-else
        icon="heroicons:x-mark"
        class="author-page__edit-icon"
        aria-hidden="true"
      />
    </button>

    <div v-if="author" class="author-page__body" :class="authorPageBodyClass">
      <!-- Author profile -->
      <div class="author-page__header">
        <div class="author-page__portrait-wrap">
          <img :src="avatarSrc" :alt="author.name" loading="eager"
            class="author-page__portrait" />
        </div>

        <div class="author-page__header-main">
          <template v-if="!authorEditMode">
            <div class="author-page__title-row">
              <h1 class="author-page__title">{{ author.name }}</h1>
              <button v-if="isSiteOwner" type="button"
                class="author-page__danger-chip"
                :disabled="deletingAuthor" @click="deleteAuthor">
                {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
              </button>
            </div>
            <p class="author-page__meta">
              <span v-if="nationalityLabel">{{ nationalityLabel }}</span>
              <span v-if="nationalityLabel && yearsLabel()"> · </span>
              <span>{{ yearsLabel() }}</span>
            </p>
          </template>

          <template v-else>
            <div class="author-page__edit-fields">
              <div>
                <label class="author-page__label">
                  {{ t('admin.authors.name') }}
                </label>
                <input v-model="nameDraft" type="text" maxlength="200"
                  class="author-page__input author-page__input--title"
                  :placeholder="t('admin.authors.placeholderName')" autocomplete="off" />
              </div>
              <div>
                <label class="author-page__label">
                  {{ t('admin.authors.nationality') }}
                </label>
                <input v-model="ethnicityDraft" type="text"
                  class="author-page__input author-page__input--narrow"
                  :placeholder="t('admin.authors.placeholderNationality')" />
              </div>
              <div>
                <label class="author-page__label">
                  {{ t('admin.authors.photoUrl') }}
                </label>
                <input v-model="imageUrlDraft" type="text"
                  class="author-page__input"
                  :placeholder="t('authors.portraitUrlPlaceholder')" autocomplete="off" spellcheck="false" />
              </div>
              <div v-if="canUploadPortraitAsAdmin"
                class="author-page__portrait-panel">
                <p class="author-page__label">
                  {{ t('authors.portraitUploadLabel') }}
                </p>
                <input ref="portraitFileInputRef" type="file" accept="image/*,.heic,.heif" class="sr-only"
                  @change="onPortraitFileSelected" />
                <div class="author-page__portrait-actions">
                  <button type="button"
                    class="author-page__portrait-btn"
                    :disabled="uploadingPortrait" @click="portraitFileInputRef?.click()">
                    {{ uploadingPortrait ? t('authors.portraitUploading') : t('authors.portraitUploadPick') }}
                  </button>
                  <span class="author-page__hint author-page__hint--inline">{{ t('authors.portraitUploadAdminOnly') }}</span>
                </div>
                <p class="author-page__hint">
                  {{ t('authors.portraitUploadHint') }}
                </p>
              </div>
              <div class="author-page__years">
                <div>
                  <label class="author-page__label">
                    {{ t('admin.authors.birthYear') }}
                  </label>
                  <input v-model="birthYearDraft" type="text" inputmode="numeric" maxlength="4"
                    class="author-page__input author-page__input--year" />
                </div>
                <div>
                  <label class="author-page__label">
                    {{ t('admin.authors.deathYear') }}
                  </label>
                  <input v-model="deathYearDraft" type="text" inputmode="numeric" maxlength="4"
                    class="author-page__input author-page__input--year" />
                </div>
              </div>
              <p class="author-page__hint">{{ t('authors.profileDetailsHint') }}</p>
              <button v-if="isSiteOwner" type="button"
                class="author-page__danger-chip"
                :disabled="deletingAuthor" @click="deleteAuthor">
                {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
              </button>
            </div>
          </template>

          <p class="author-page__poem-count">
            {{ t('authors.poemCount', meta?.total ?? 0) }}
          </p>
        </div>
      </div>

      <!-- Biography -->
      <section class="author-page__section">
        <h2 class="author-page__section-title">{{ t('authors.biography') }}</h2>
        <template v-if="authorEditMode">
          <textarea v-model="bioDraft" rows="14"
            class="author-page__bio-input" />
        </template>
        <template v-else>
          <div v-if="author.bio" class="author-page__bio-read">
            <p ref="bioReadRef" class="author-page__bio-text"
              :class="{ 'author-page__bio-text--clamped': !bioExpanded }">
              {{ author.bio }}
            </p>
            <button v-if="bioToggleVisible && !authorEditMode" type="button"
              class="author-page__bio-more"
              :aria-expanded="bioExpanded" @click="bioExpanded = !bioExpanded">
              {{ bioExpanded ? t('authors.biographyCollapse') : t('authors.biographyExpand') }}
            </button>
          </div>
          <p v-else class="author-page__bio-empty">{{ t('authors.bioUnavailable') }}</p>
        </template>
      </section>

      <!-- Bibliography + active poem -->
      <section v-if="works.length || canAddPoemFromBibliography" class="author-page__section author-page__section--works">
        <div class="author-page__works-head">
          <h2 class="author-page__section-title">{{ t('authors.bibliography') }}</h2>
          <button v-if="canAddPoemFromBibliography" type="button"
            class="author-page__add-poem"
            :aria-label="t('authors.addPoemAria')" :title="t('authors.addPoemAria')" @click="openAddPoemModal">
            <Icon icon="heroicons:plus" class="author-page__add-icon" aria-hidden="true" />
          </button>
        </div>

        <div class="author-page__works-grid">
          <!-- Bibliography navigation (in-page on all breakpoints) -->
          <div class="author-page__works-list">
            <ul
              class="author-page__works-scroll"
              role="listbox"
              :aria-label="t('authors.worksListAria')"
            >
              <li
                v-if="!works.length && canAddPoemFromBibliography"
                class="author-page__works-empty"
              >
                {{ t('authors.bibliographyEmptyStaff') }}
              </li>
              <li v-for="w in works" :key="w.slug">
                <button
                  type="button"
                  role="option"
                  class="author-page__work-item"
                  :class="selectedSlug === w.slug ? 'author-page__work-item--active' : ''"
                  :aria-selected="selectedSlug === w.slug"
                  @click="selectWork(w.slug)"
                >
                  <span class="author-page__work-title">{{ w.title }}</span>
                  <PoemCarouselIcon :slug="w.slug" size="sm" class="shrink-0" />
                </button>
              </li>
            </ul>
          </div>

          <!-- Active poem (scroll target for ?poem= deep links) -->
          <div ref="activePoemPanelRef" class="author-page__poem-panel">
            <div class="author-page__poem-card">
              <div v-if="poemPending" class="author-page__poem-loading">
                <span class="ph-spinner ph-spinner--lg" aria-hidden="true" />
              </div>
              <template v-else-if="activePoem">
                <PoetryViewer
                  ref="poetryViewerRef"
                  :poem="activePoem"
                  :allow-poem-edit="canEditPoem && authorEditMode"
                  :auto-poem-edit="canEditPoem && authorEditMode"
                  :show-poem-edit-toolbar="false"
                  :show-mobile-actions="false"
                  @updated="onPoemUpdated"
                />
              </template>
              <p v-else-if="poemLoadFailed" class="author-page__poem-msg">
                {{ t('authors.poemCouldNotLoad') }}
              </p>
              <p v-else-if="!works.length && canAddPoemFromBibliography"
                class="author-page__poem-msg author-page__poem-msg--pad">
                {{ t('authors.addFirstPoemInPanelHint') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div v-else class="author-page__no-poems">
        <p>{{ t('authors.noPoemsYet') }}</p>
      </div>
    </div>

    <!-- Unified save / discard — fixed to viewport -->
    <div v-if="authorEditMode && author" class="author-page__edit-bar">
      <div :class="[PAGE_SHELL_INSET_CLASS, 'author-page__edit-bar-inner']">
        <button type="button"
          class="author-page__edit-save"
          :disabled="savingEdits" @click="saveAllEdits">
          {{ savingEdits ? t('admin.authors.saving') : t('authors.saveAuthorChanges') }}
        </button>
        <button type="button"
          class="author-page__edit-discard"
          :disabled="savingEdits" @click="discardAllEdits">
          {{ t('authors.discardEdits') }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="addPoemModalOpen && author" class="author-page__modal">
        <div class="author-page__modal-backdrop" aria-hidden="true"
          @click="onAddPoemModalBackdropClick" />
        <div role="dialog" aria-modal="true" aria-labelledby="authors-add-poem-modal-title"
          class="author-page__modal-panel">
          <div class="author-page__modal-header">
            <h3 id="authors-add-poem-modal-title" class="author-page__modal-title">
              {{ t('authors.addPoemModalTitle') }}
            </h3>
            <p class="author-page__modal-sub">{{ t('authors.addPoemForAuthor', { name: author.name }) }}</p>
          </div>
          <div class="author-page__modal-body">
            <div v-if="createPoemError" class="author-page__modal-error">
              {{ createPoemError }}
            </div>
            <label class="author-page__label"
              for="authors-new-poem-title">{{ t('admin.poemForm.titleRequired') }}</label>
            <div class="author-page__modal-field">
              <input id="authors-new-poem-title" v-model="newPoemTitle" type="text" maxlength="500"
                class="author-page__modal-input"
                :class="newPoemTitleLooksDuplicate
                  ? 'author-page__modal-input--dup'
                  : 'author-page__modal-input--ok'"
                :placeholder="t('admin.poemForm.placeholderTitle')" autocomplete="off"
                :aria-invalid="newPoemTitleLooksDuplicate ? 'true' : undefined"
                :aria-describedby="newPoemTitleLooksDuplicate ? 'authors-new-poem-title-dup' : undefined" />
              <p v-if="newPoemTitleLooksDuplicate" id="authors-new-poem-title-dup" role="alert"
                class="author-page__modal-warn">
                {{ t('authors.duplicatePoemTitle') }}
              </p>
            </div>
            <label class="author-page__label"
              for="authors-new-poem-content">{{ t('admin.poemForm.contentRequired') }}</label>
            <textarea id="authors-new-poem-content" v-model="newPoemContent" rows="12"
              class="author-page__modal-input author-page__modal-input--textarea"
              :placeholder="t('admin.poemForm.placeholderContent')" />
            <p class="author-page__hint">{{ t('admin.poemForm.contentHint') }}</p>
          </div>
          <div class="author-page__modal-footer">
            <button type="button"
              class="author-page__modal-cancel"
              :disabled="creatingPoem" @click="closeAddPoemModal">{{ t('admin.poemForm.cancel') }}</button>
            <button type="button"
              class="author-page__modal-submit"
              :disabled="creatingPoem || newPoemTitleLooksDuplicate" @click="submitNewPoemFromModal">
              {{ creatingPoem ? t('admin.poemForm.saving') : t('authors.addPoemSubmit') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
