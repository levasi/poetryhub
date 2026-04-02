<script setup lang="ts">
import type { CarouselTheme } from '~/composables/useCarouselGenerator'
import {
  buildCarouselSlides,
  buildInstagramCaption,
  CAROUSEL_HEIGHT,
  CAROUSEL_LINES_PER_BODY_SLIDE,
  CAROUSEL_WIDTH,
  downloadBlob,
  elementToPngBlob,
  blobsToZipDownload,
  fontScaleForBody,
  fontScaleForTitle,
  formatAuthorLifespan,
  slideFilename,
  splitPoemIntoSlides,
} from '~/composables/useCarouselGenerator'
import type { Poem } from '~/composables/usePoems'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'
import CarouselFontSelect from '~/components/carousel/CarouselFontSelect.vue'
import { authorAvatarUrl } from '~/utils/authorAvatar'
import type { CarouselSiteDefaultsPayload } from '~/utils/carouselSiteDefaults'
import { resolveCarouselDefaultsAdminEmail } from '~/utils/carouselDefaultsAdmin'
import {
  parsePoemCarouselSettings,
  type PoemCarouselSettingsPayload,
} from '~/utils/poemCarouselFontSettings'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { user, fetchMe, isLoggedIn } = useAuth()

useHead({
  title: () => t('carousel.seoTitle'),
  meta: [{ name: 'description', content: () => t('carousel.seoDesc') }],
})

const title = ref('')
const author = ref('')
/** Cover slide: origin / nationality (DB `Author.nationality` or free text, e.g. ethnicity). */
const authorNationality = ref('')
const authorBirthYear = ref('')
const authorDeathYear = ref('')
/** Year the poem was written (cover slide); optional, same source as DB `Poem.writtenYear` when loaded. */
const poemWrittenYear = ref('')
const poemText = ref('')
const theme = ref<CarouselTheme>('dark')
const ctaText = ref('')
const keywordInput = ref('')
const keywords = computed(() =>
  keywordInput.value
    .split(/[,;]+/)
    .map((k) => k.trim())
    .filter(Boolean),
)

const { query: libraryQuery, results: searchResults, loading: searchLoading, search: runSearch } = useSearch()

/** Verse layout (body slides). */
const linesPerSlide = ref(CAROUSEL_LINES_PER_BODY_SLIDE)
const bodyFontSizeScale = ref(1)
const bodyLineHeight = ref(1.65)
/** Font stack for all carousel slide text (same catalog as poem reader). */
const carouselFontKey = ref<ReaderFontKey>('literata')
const carouselFontFamily = computed(() => READER_FONT_STACKS[carouselFontKey.value])

const { data: siteDefaults } = await useFetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults', {
  key: 'carousel-site-defaults',
})

function applyCarouselTypographyFromSiteDefaults(d: CarouselSiteDefaultsPayload) {
  carouselFontKey.value = d.carouselFontKey
  linesPerSlide.value = d.linesPerSlide
  bodyFontSizeScale.value = d.bodyFontSizeScale
  bodyLineHeight.value = d.bodyLineHeight
}

function applyCarouselSiteDefaultsNonTypography(d: CarouselSiteDefaultsPayload) {
  theme.value = d.theme
  ctaText.value = d.ctaText.trim() || t('carousel.defaultCta')
  keywordInput.value = d.keywordInput
}

function applyCarouselSiteDefaults(d: CarouselSiteDefaultsPayload) {
  applyCarouselSiteDefaultsNonTypography(d)
  applyCarouselTypographyFromSiteDefaults(d)
}

function applyPoemCarouselSettings(p: PoemCarouselSettingsPayload) {
  if (p.theme !== undefined) theme.value = p.theme
  carouselFontKey.value = p.carouselFontKey as ReaderFontKey
  linesPerSlide.value = p.linesPerSlide
  bodyFontSizeScale.value = p.bodyFontSizeScale
  bodyLineHeight.value = p.bodyLineHeight
  if (p.ctaText !== undefined) ctaText.value = p.ctaText
  if (p.keywordInput !== undefined) keywordInput.value = p.keywordInput
}

/** Slug of the poem loaded from the library (route or search); used to save per-poem carousel. */
const loadedPoemSlug = ref<string | null>(null)
/** True when DB has saved carousel JSON for this poem — site defaults must not overwrite it. */
const poemCarouselOverridesFromDb = ref(false)

const isLibraryPoemContext = computed(() => {
  const q = route.query.slug
  const fromRoute = typeof q === 'string' && q.trim()
  return Boolean(fromRoute || loadedPoemSlug.value)
})

watch(
  siteDefaults,
  (d) => {
    if (!d) return
    if (isLibraryPoemContext.value && poemCarouselOverridesFromDb.value) return
    if (isLibraryPoemContext.value) {
      applyCarouselSiteDefaultsNonTypography(d)
      applyCarouselTypographyFromSiteDefaults(d)
    } else {
      applyCarouselSiteDefaults(d)
    }
  },
  { immediate: true },
)

const adminEmailLower = computed(() =>
  resolveCarouselDefaultsAdminEmail(
    runtimeConfig.public.carouselDefaultsAdminEmail as string | undefined,
  ),
)
const canSaveCurrentPoemCarousel = computed(() => {
  const u = user.value
  if (!u?.email) return false
  if (u.role === 'admin') return true
  return u.email.toLowerCase() === adminEmailLower.value
})

const savingCurrentPoemCarousel = ref(false)
const showCurrentPoemCarouselThumbsUp = ref(false)
let currentPoemCarouselThumbsHideTimer: ReturnType<typeof setTimeout> | null = null
const deletingPoem = ref(false)

async function deleteLoadedPoem() {
  const slug = loadedPoemSlug.value
  if (!slug || !canSaveCurrentPoemCarousel.value) return
  if (!confirm(t('carousel.deletePoemConfirm'))) return
  deletingPoem.value = true
  try {
    await $fetch(`/api/poems/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (typeof route.query.slug === 'string' && route.query.slug === slug) {
      await navigateTo({ path: '/carousel-generator', replace: true })
    }
    loadSample()
  } catch (e: unknown) {
    console.error(e)
    const code =
      e && typeof e === 'object' && 'statusCode' in e
        ? (e as { statusCode?: number }).statusCode
        : undefined
    const msg =
      code === 401
        ? t('carousel.defaultsSaveError401')
        : code === 403
          ? t('carousel.defaultsSaveError403')
          : t('carousel.deletePoemError')
    alert(msg)
  } finally {
    deletingPoem.value = false
  }
}

async function saveCurrentPoemCarousel() {
  const slug = loadedPoemSlug.value
  if (!slug || !canSaveCurrentPoemCarousel.value) return
  savingCurrentPoemCarousel.value = true
  try {
    if (poemText.value.trim()) {
      await $fetch(`/api/poems/${encodeURIComponent(slug)}/content`, {
        method: 'PUT',
        credentials: 'include',
        body: { content: poemText.value },
      })
    }
    await $fetch<PoemCarouselSettingsPayload>(`/api/poems/${encodeURIComponent(slug)}/carousel-font`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        theme: theme.value,
        carouselFontKey: carouselFontKey.value,
        linesPerSlide: linesPerSlide.value,
        bodyFontSizeScale: bodyFontSizeScale.value,
        bodyLineHeight: bodyLineHeight.value,
        ctaText: ctaText.value,
        keywordInput: keywordInput.value,
      },
    })
    poemCarouselOverridesFromDb.value = true
    if (currentPoemCarouselThumbsHideTimer) clearTimeout(currentPoemCarouselThumbsHideTimer)
    showCurrentPoemCarouselThumbsUp.value = false
    await nextTick()
    showCurrentPoemCarouselThumbsUp.value = true
    currentPoemCarouselThumbsHideTimer = setTimeout(() => {
      showCurrentPoemCarouselThumbsUp.value = false
      currentPoemCarouselThumbsHideTimer = null
    }, 2200)
  } catch (e: unknown) {
    console.error(e)
    const code =
      e && typeof e === 'object' && 'statusCode' in e
        ? (e as { statusCode?: number }).statusCode
        : undefined
    const msg =
      code === 401
        ? t('carousel.defaultsSaveError401')
        : code === 403
          ? t('carousel.defaultsSaveError403')
          : t('carousel.poemCarouselSaveError')
    alert(msg)
  } finally {
    savingCurrentPoemCarousel.value = false
  }
}

const slideSplitOpts = computed(() => ({
  maxLinesPerSlide: Math.min(20, Math.max(4, Math.round(linesPerSlide.value))),
}))

const slideModels = computed(() => buildCarouselSlides(poemText.value, slideSplitOpts.value))
const currentIndex = ref(0)
const maxIndex = computed(() => Math.max(0, slideModels.value.length - 1))

watch(slideModels, () => {
  if (currentIndex.value > maxIndex.value) currentIndex.value = maxIndex.value
})

/** Set when a poem is loaded from the library so we use DB author photo + slug. */
const authorAvatarFromPoem = ref<{ slug: string; name: string; imageUrl?: string | null } | null>(null)

function slugSeedFromName(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'author'
  )
}

const coverAvatarUrl = computed(() =>
  authorAvatarUrl(
    authorAvatarFromPoem.value ?? {
      slug: slugSeedFromName(author.value),
      name: author.value || t('carousel.unknownAuthor'),
      imageUrl: null,
    },
  ),
)

function parseYearInput(s: string): number | null {
  const n = parseInt(String(s).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function applyAuthorMetaFromApi(a: {
  nationality?: string | null
  birthYear?: number | null
  deathYear?: number | null
}) {
  authorNationality.value = a.nationality?.trim() ?? ''
  authorBirthYear.value = a.birthYear != null ? String(a.birthYear) : ''
  authorDeathYear.value = a.deathYear != null ? String(a.deathYear) : ''
}

watch(author, (v) => {
  const m = authorAvatarFromPoem.value
  if (m && v.trim() !== m.name.trim()) {
    authorAvatarFromPoem.value = null
    authorNationality.value = ''
    authorBirthYear.value = ''
    authorDeathYear.value = ''
    poemWrittenYear.value = ''
  }
})

function slidePropsFor(index: number) {
  const models = slideModels.value
  const model = models[index]
  if (!model) return null
  const wy = parseYearInput(poemWrittenYear.value)
  const writtenYearLine =
    wy != null ? t('carousel.coverWrittenYear', { year: wy }) : ''
  const base = {
    theme: theme.value,
    title: title.value || t('carousel.untitled'),
    author: author.value || t('carousel.unknownAuthor'),
    authorNationality: authorNationality.value.trim(),
    authorLifespan: formatAuthorLifespan(
      parseYearInput(authorBirthYear.value),
      parseYearInput(authorDeathYear.value),
    ),
    writtenYearLine,
    avatarUrl: coverAvatarUrl.value,
    ctaText: ctaText.value || t('carousel.defaultCta'),
    keywords: keywords.value,
    bodyFontSizeScale: bodyFontSizeScale.value,
    bodyLineHeight: bodyLineHeight.value,
    fontFamily: carouselFontFamily.value,
  }
  const splitOpts = { linesPerSlide: slideSplitOpts.value.maxLinesPerSlide }
  if (model.kind === 'cover') {
    return {
      ...base,
      variant: 'cover' as const,
      fontScaleBody: 1,
      titleScale: fontScaleForTitle(title.value || t('carousel.untitled')),
    }
  }
  if (model.kind === 'cta') {
    return {
      ...base,
      variant: 'cta' as const,
      fontScaleBody: 1,
      titleScale: 1,
    }
  }
  return {
    ...base,
    variant: 'body' as const,
    lines: model.lines,
    fontScaleBody: fontScaleForBody(model.lines, splitOpts),
    titleScale: 1,
  }
}

const currentSlideProps = computed(() => slidePropsFor(currentIndex.value))

const bodySlideCount = computed(() => splitPoemIntoSlides(poemText.value, slideSplitOpts.value).length)

const previewFrameRef = ref<HTMLElement | null>(null)
const previewFrameWidth = ref(420)

function updatePreviewFrameWidth() {
  previewFrameWidth.value = previewFrameRef.value?.clientWidth ?? 420
}

let previewResizeObserver: ResizeObserver | null = null

watch(
  () => previewFrameRef.value,
  (el) => {
    previewResizeObserver?.disconnect()
    previewResizeObserver = null
    if (!el) return
    updatePreviewFrameWidth()
    previewResizeObserver = new ResizeObserver(updatePreviewFrameWidth)
    previewResizeObserver.observe(el)
  },
  { flush: 'post' },
)

const previewFullscreenRef = ref<HTMLElement | null>(null)
const isPreviewFullscreen = ref(false)

function syncPreviewFullscreenState() {
  const el = previewFullscreenRef.value
  const fs =
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement
  isPreviewFullscreen.value = Boolean(el && fs === el)
}

function requestElementFullscreen(el: HTMLElement) {
  const anyEl = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  return el.requestFullscreen?.() ?? anyEl.webkitRequestFullscreen?.() ?? Promise.resolve()
}

function exitDocumentFullscreen() {
  const d = document as Document & { webkitExitFullscreen?: () => Promise<void> }
  return document.exitFullscreen?.() ?? d.webkitExitFullscreen?.() ?? Promise.resolve()
}

async function togglePreviewFullscreen() {
  const el = previewFullscreenRef.value
  if (!el) return
  try {
    if (isPreviewFullscreen.value) {
      await exitDocumentFullscreen()
    } else {
      await requestElementFullscreen(el)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncPreviewFullscreenState)
  document.addEventListener('webkitfullscreenchange', syncPreviewFullscreenState)
  void fetchMe()
})

onUnmounted(() => {
  previewResizeObserver?.disconnect()
  if (currentPoemCarouselThumbsHideTimer) clearTimeout(currentPoemCarouselThumbsHideTimer)
  document.removeEventListener('fullscreenchange', syncPreviewFullscreenState)
  document.removeEventListener('webkitfullscreenchange', syncPreviewFullscreenState)
  const el = previewFullscreenRef.value
  const fs =
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement
  if (el && fs === el) void exitDocumentFullscreen()
})

const previewScale = computed(() => previewFrameWidth.value / CAROUSEL_WIDTH)

const exporting = ref(false)
const exportIndex = ref(0)
const captureRef = ref<{ $el?: HTMLElement } | null>(null)

function getCaptureRoot(): HTMLElement | null {
  const inst = captureRef.value
  const root = inst && '$el' in inst ? (inst.$el as HTMLElement) : null
  if (!root) return null
  return (root.querySelector?.('.carousel-canvas') as HTMLElement) ?? root
}

async function exportZip() {
  if (!poemText.value.trim() || !title.value.trim()) {
    alert(t('carousel.needTitleBody'))
    return
  }
  exporting.value = true
  const n = slideModels.value.length
  const files: Array<{ name: string; blob: Blob }> = []
  try {
    for (let i = 0; i < n; i++) {
      exportIndex.value = i
      await nextTick()
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      await document.fonts.ready
      const el = getCaptureRoot()
      if (!el) throw new Error('capture root')
      const blob = await elementToPngBlob(el, { scale: 2 })
      files.push({ name: slideFilename(title.value, i), blob })
    }
    const zipName = `${title.value.replace(/\s+/g, '-').slice(0, 40) || 'poem'}-carousel.zip`
    await blobsToZipDownload(files, zipName)
  } catch (e) {
    console.error(e)
    alert(t('carousel.exportError'))
  } finally {
    exporting.value = false
  }
}

async function exportCurrentPng() {
  const el = document.querySelector('.carousel-preview-inner .carousel-canvas') as HTMLElement | null
  if (!el) return
  try {
    const blob = await elementToPngBlob(el, { scale: 2 })
    await downloadBlob(blob, slideFilename(title.value || 'poem', currentIndex.value))
  } catch (e) {
    console.error(e)
    alert(t('carousel.exportError'))
  }
}

const captionText = computed(() =>
  buildInstagramCaption(
    title.value || t('carousel.untitled'),
    author.value || '',
    poemText.value,
    t('carousel.captionHandle'),
  ),
)

function copyCaption() {
  void navigator.clipboard.writeText(captionText.value)
}

async function applyPoem(p: Poem) {
  title.value = p.title
  author.value = p.author.name
  authorAvatarFromPoem.value = { slug: p.author.slug, name: p.author.name, imageUrl: p.author.imageUrl }
  const full = await $fetch<Poem>(`/api/poems/${p.slug}`)
  loadedPoemSlug.value = full.slug
  poemText.value = full.content
  authorAvatarFromPoem.value = {
    slug: full.author.slug,
    name: full.author.name,
    imageUrl: full.author.imageUrl,
  }
  applyAuthorMetaFromApi(full.author)
  poemWrittenYear.value = full.writtenYear != null ? String(full.writtenYear) : ''
  const parsed = parsePoemCarouselSettings(full.carouselFontSettings)
  if (parsed) {
    applyPoemCarouselSettings(parsed)
    poemCarouselOverridesFromDb.value = true
  } else {
    poemCarouselOverridesFromDb.value = false
    if (siteDefaults.value) {
      applyCarouselSiteDefaultsNonTypography(siteDefaults.value)
      applyCarouselTypographyFromSiteDefaults(siteDefaults.value)
    }
  }
  currentIndex.value = 0
}

async function loadFromSlug(slug: string) {
  try {
    const full = await $fetch<Poem>(`/api/poems/${slug}`)
    loadedPoemSlug.value = full.slug
    title.value = full.title
    author.value = full.author.name
    authorAvatarFromPoem.value = {
      slug: full.author.slug,
      name: full.author.name,
      imageUrl: full.author.imageUrl,
    }
    applyAuthorMetaFromApi(full.author)
    poemText.value = full.content
    poemWrittenYear.value = full.writtenYear != null ? String(full.writtenYear) : ''
    const parsed = parsePoemCarouselSettings(full.carouselFontSettings)
    if (parsed) {
      applyPoemCarouselSettings(parsed)
      poemCarouselOverridesFromDb.value = true
    } else {
      poemCarouselOverridesFromDb.value = false
      if (siteDefaults.value) {
        applyCarouselSiteDefaultsNonTypography(siteDefaults.value)
        applyCarouselTypographyFromSiteDefaults(siteDefaults.value)
      }
    }
    currentIndex.value = 0
  } catch {
    loadedPoemSlug.value = null
    poemCarouselOverridesFromDb.value = false
    if (!poemText.value.trim()) loadSample()
  }
}

function loadSample() {
  loadedPoemSlug.value = null
  poemCarouselOverridesFromDb.value = false
  title.value = t('carousel.sampleTitle')
  author.value = t('carousel.sampleAuthor')
  authorAvatarFromPoem.value = null
  authorNationality.value = t('carousel.sampleNationality')
  authorBirthYear.value = t('carousel.sampleBirthYear')
  authorDeathYear.value = t('carousel.sampleDeathYear')
  poemWrittenYear.value = t('carousel.samplePoemWrittenYear')
  poemText.value = t('carousel.samplePoem')
  currentIndex.value = 0
  if (siteDefaults.value) applyCarouselSiteDefaults(siteDefaults.value)
}

watch(
  () => route.query.slug,
  async (slug) => {
    if (typeof slug === 'string' && slug.trim()) {
      await loadFromSlug(slug.trim())
      return
    }
    loadedPoemSlug.value = null
    poemCarouselOverridesFromDb.value = false
    if (siteDefaults.value) applyCarouselSiteDefaults(siteDefaults.value)
    if (!poemText.value.trim()) loadSample()
  },
  { immediate: true },
)

const touchStartX = ref<number | null>(null)
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.changedTouches[0]?.clientX ?? null
}
function onTouchEnd(e: TouchEvent) {
  if (touchStartX.value == null) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.value
  touchStartX.value = null
  if (Math.abs(dx) < 48) return
  if (dx < 0 && currentIndex.value < maxIndex.value) currentIndex.value++
  else if (dx > 0 && currentIndex.value > 0) currentIndex.value--
}
</script>

<template>
  <div class="w-full px-4 pb-16 sm:px-6 lg:px-10 xl:px-14">
    <!-- Full-width: left 4/7, right 3/7 from md -->
    <div class="grid grid-cols-1 gap-10 md:grid-cols-7 md:items-start md:gap-8 lg:gap-10">
      <!-- Left (4 columns): Controls -->
      <div class="min-w-0 space-y-6 md:col-span-4">
        <section class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 font-serif text-lg font-semibold text-ink-900">
            {{ t('carousel.sectionInput') }}
          </h2>

          <label class="field-label">{{ t('carousel.fieldTitle') }}</label>
          <input v-model="title" type="text"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 font-serif text-ink-900 outline-none focus:border-gold-500"
            :placeholder="t('carousel.phTitle')" />

          <label class="field-label">{{ t('carousel.fieldAuthor') }}</label>
          <input v-model="author" type="text"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
            :placeholder="t('carousel.phAuthor')" />

          <label class="field-label">{{ t('carousel.fieldNationality') }}</label>
          <input v-model="authorNationality" type="text"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
            :placeholder="t('carousel.phNationality')" />

          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">{{ t('carousel.fieldBirthYear') }}</label>
              <input v-model="authorBirthYear" type="text" inputmode="numeric"
                class="w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
                :placeholder="t('carousel.phBirthYear')" />
            </div>
            <div>
              <label class="field-label">{{ t('carousel.fieldDeathYear') }}</label>
              <input v-model="authorDeathYear" type="text" inputmode="numeric"
                class="w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
                :placeholder="t('carousel.phDeathYear')" />
            </div>
          </div>

          <label class="field-label">{{ t('carousel.fieldPoemWrittenYear') }}</label>
          <input v-model="poemWrittenYear" type="text" inputmode="numeric"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
            :placeholder="t('carousel.phPoemWrittenYear')" />

          <label class="field-label">{{ t('carousel.fieldPoem') }}</label>
          <textarea v-model="poemText" rows="10"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-3 font-serif leading-relaxed text-ink-800 outline-none focus:border-gold-500"
            :placeholder="t('carousel.phPoem')" />

          <h3 class="mb-3 font-serif text-base font-semibold text-ink-900">
            {{ t('carousel.sectionInstagramPostSettings') }}
          </h3>

          <label class="field-label">{{ t('carousel.fieldFont') }}</label>
          <CarouselFontSelect v-model="carouselFontKey" class="mb-2" />
          <p class="mb-4 text-xs leading-relaxed text-ink-500">
            {{ t('carousel.fontCarouselHint') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldTheme') }}</label>
          <div class="mb-4 flex flex-wrap gap-2">
            <button v-for="th in (['minimal', 'dark', 'gradient', 'neon'] as CarouselTheme[])" :key="th" type="button"
              class="rounded-full border px-4 py-1.5 text-sm transition" :class="theme === th
                ? 'border-gold-500 bg-gold-500 text-white'
                : 'border-ink-200 bg-ink-50 text-ink-700 hover:border-ink-300'
                " @click="theme = th">
              {{ t(`carousel.theme.${th}`) }}
            </button>
          </div>

          <label class="field-label">{{ t('carousel.fieldCta') }}</label>
          <input v-model="ctaText" type="text"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500" />

          <label class="field-label">{{ t('carousel.fieldKeywords') }}</label>
          <input v-model="keywordInput" type="text"
            class="mb-4 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500"
            :placeholder="t('carousel.phKeywords')" />

          <div class="border-t border-ink-100 pt-4">
            <h3 class="mb-3 font-serif text-base font-semibold text-ink-900">
              {{ t('carousel.sectionTypography') }}
            </h3>

            <label class="field-label">{{ t('carousel.fieldLinesPerSlide') }}</label>
            <div class="mb-4 flex items-center gap-3">
              <input v-model.number="linesPerSlide" type="range" min="4" max="16" step="1"
                class="h-2 flex-1 cursor-pointer accent-gold-600" />
              <span class="w-10 text-right text-sm tabular-nums text-ink-700">{{ linesPerSlide }}</span>
            </div>

            <label class="field-label">{{ t('carousel.fieldBodyFontSize') }}</label>
            <div class="mb-4 flex items-center gap-3">
              <input v-model.number="bodyFontSizeScale" type="range" min="0.7" max="2" step="0.05"
                class="h-2 flex-1 cursor-pointer accent-gold-600" />
              <span class="w-12 text-right text-sm tabular-nums text-ink-700">{{ Math.round(bodyFontSizeScale * 100)
              }}%</span>
            </div>

            <label class="field-label">{{ t('carousel.fieldLineHeight') }}</label>
            <div class="mb-4 flex items-center gap-3">
              <input v-model.number="bodyLineHeight" type="range" min="1.15" max="2.25" step="0.05"
                class="h-2 flex-1 cursor-pointer accent-gold-600" />
              <span class="w-12 text-right text-sm tabular-nums text-ink-700">{{ bodyLineHeight.toFixed(2) }}</span>
            </div>

            <div v-if="canSaveCurrentPoemCarousel && loadedPoemSlug" class="mb-4 border-t border-ink-100 pt-4">
              <p class="mb-2 text-xs text-ink-500">
                {{ t('carousel.poemCarouselSaveHint') }}
              </p>
              <button type="button"
                class="w-full rounded-xl border border-gold-500 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-gold-500/20 disabled:opacity-50"
                :disabled="savingCurrentPoemCarousel" @click="saveCurrentPoemCarousel">
                {{ savingCurrentPoemCarousel ? t('carousel.savingCurrentPoemCarousel') :
                  t('carousel.saveCurrentPoemCarousel') }}
              </button>
              <Transition name="defaults-thumbs">
                <div v-if="showCurrentPoemCarouselThumbsUp"
                  class="defaults-save-thumbs mt-4 flex flex-col items-center justify-center gap-1" role="status"
                  aria-live="polite">
                  <span class="sr-only">{{ t('carousel.poemCarouselSaved') }}</span>
                  <svg class="defaults-save-thumbs-icon h-14 w-14 text-emerald-600" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                    aria-hidden="true">
                    <path d="M7 10v12" />
                    <path
                      d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                  </svg>
                </div>
              </Transition>
            </div>

            <div v-if="canSaveCurrentPoemCarousel && loadedPoemSlug" class="border-t border-ink-100 pt-4">
              <button type="button"
                class="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                :disabled="deletingPoem || savingCurrentPoemCarousel" @click="deleteLoadedPoem">
                {{ deletingPoem ? t('carousel.deletingPoem') : t('carousel.deletePoem') }}
              </button>
            </div>

            <p v-if="!isLoggedIn" class="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-500">
              {{ t('carousel.poemSaveLoginHint') }}
            </p>
            <p v-else-if="canSaveCurrentPoemCarousel && !loadedPoemSlug"
              class="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-500">
              {{ t('carousel.poemSaveNeedPoemHint') }}
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 font-serif text-lg font-semibold text-ink-900">
            {{ t('carousel.sectionLibrary') }}
          </h2>
          <label class="field-label">{{ t('carousel.searchPoems') }}</label>
          <input v-model="libraryQuery" type="search"
            class="mb-3 w-full rounded-xl border border-ink-200 px-4 py-2.5 outline-none focus:border-gold-500"
            :placeholder="t('carousel.searchPlaceholder')" @keyup.enter="runSearch(libraryQuery)" />
          <p v-if="searchLoading" class="text-sm text-ink-500">
            {{ t('carousel.searching') }}
          </p>
          <template v-else>
            <ul v-if="searchResults.length"
              class="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-ink-100 bg-ink-50/80 p-2">
              <li v-for="p in searchResults" :key="p.id">
                <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-800 hover:bg-white"
                  @click="applyPoem(p)">
                  <span class="font-medium">{{ p.title }}</span>
                  <span class="text-ink-500"> — {{ p.author.name }}</span>
                </button>
              </li>
            </ul>
            <p v-else-if="libraryQuery.trim() && !searchResults.length"
              class="rounded-lg border border-ink-100 bg-ink-50/80 px-3 py-2 text-sm text-ink-500">
              {{ t('carousel.noResults') }}
            </p>
          </template>
          <button type="button" class="mt-3 text-sm text-gold-700 underline-offset-2 hover:underline"
            @click="loadSample">
            {{ t('carousel.loadSample') }}
          </button>
        </section>

        <section class="rounded-2xl border border-ink-200 bg-ink-900 p-6 text-ink-50 shadow-sm">
          <h2 class="mb-3 font-serif text-lg font-semibold">
            {{ t('carousel.sectionExport') }}
          </h2>
          <p class="mb-4 text-sm text-ink-300">
            {{ t('carousel.exportHint') }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button type="button"
              class="rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-gold-600 disabled:opacity-50"
              :disabled="exporting" @click="exportZip">
              {{ exporting ? t('carousel.exporting') : t('carousel.downloadZip') }}
            </button>
            <button type="button"
              class="rounded-xl border border-ink-500 px-5 py-2.5 text-sm font-medium hover:bg-ink-800"
              @click="exportCurrentPng">
              {{ t('carousel.downloadCurrent') }}
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-serif text-lg font-semibold text-ink-900">
              {{ t('carousel.sectionCaption') }}
            </h2>
            <button type="button" class="text-sm font-medium text-gold-700 hover:underline" @click="copyCaption">
              {{ t('carousel.copyCaption') }}
            </button>
          </div>
          <pre
            class="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-ink-50 p-4 font-sans text-xs text-ink-700">{{
              captionText }}</pre>
        </section>
      </div>

      <!-- Right (3 columns): Preview — carousel then controls below -->
      <div class="w-full md:col-span-3 md:sticky md:top-24 md:self-start">
        <div ref="previewFullscreenRef"
          class="carousel-preview-shell flex flex-col rounded-2xl border border-ink-200 bg-ink-100 p-4 shadow-inner">
          <div class="carousel-preview-fs-header mb-3 flex shrink-0 items-center justify-between gap-2">
            <span class="text-xs font-medium uppercase tracking-wider text-ink-500">
              {{ t('carousel.preview') }} · {{ t('carousel.dimensions') }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-ink-600 tabular-nums">
                {{ currentIndex + 1 }} / {{ slideModels.length }}
              </span>
              <button type="button"
                class="rounded-lg border border-ink-200 bg-white p-1.5 text-ink-600 shadow-sm transition hover:border-gold-400 hover:text-ink-900"
                :aria-pressed="isPreviewFullscreen"
                :aria-label="isPreviewFullscreen ? t('carousel.exitFullScreen') : t('carousel.enterFullScreen')"
                :title="isPreviewFullscreen ? t('carousel.exitFullScreen') : t('carousel.enterFullScreen')"
                @click="togglePreviewFullscreen">
                <!-- Enter fullscreen -->
                <svg v-if="!isPreviewFullscreen" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4 8V4m0 0h4M4 16v4m0 0h4m8-16h4m0 0v4m0 4v4m0 4h-4m-8 0H4" />
                </svg>
                <!-- Exit fullscreen -->
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                  aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              </button>
            </div>
          </div>

          <div :class="[
            isPreviewFullscreen
              ? 'carousel-preview-fs-body flex min-h-0 flex-1 flex-col overflow-hidden'
              : '',
          ]">
            <div :class="isPreviewFullscreen
              ? 'carousel-preview-fs-grid grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 overflow-hidden sm:grid-cols-[minmax(0,19rem)_1fr] sm:items-stretch sm:gap-6'
              : 'flex flex-col gap-4'">
              <!-- Fullscreen: settings column (left on sm+); hidden when not fullscreen -->
              <div v-if="isPreviewFullscreen"
                class="carousel-fullscreen-fonts order-2 min-h-0 max-h-full overflow-y-auto rounded-xl border border-ink-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:order-none sm:max-h-none">
                <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {{ t('carousel.fullscreenFontSettings') }}
                </p>
                <label class="field-label">{{ t('carousel.fieldFont') }}</label>
                <CarouselFontSelect v-model="carouselFontKey" class="mb-4" />

                <label class="field-label">{{ t('carousel.fieldLinesPerSlide') }}</label>
                <div class="mb-3 flex items-center gap-3">
                  <input v-model.number="linesPerSlide" type="range" min="4" max="16" step="1"
                    class="h-2 flex-1 cursor-pointer accent-gold-600" />
                  <span class="w-10 text-right text-sm tabular-nums text-ink-700">{{ linesPerSlide }}</span>
                </div>

                <label class="field-label">{{ t('carousel.fieldBodyFontSize') }}</label>
                <div class="mb-3 flex items-center gap-3">
                  <input v-model.number="bodyFontSizeScale" type="range" min="0.7" max="2" step="0.05"
                    class="h-2 flex-1 cursor-pointer accent-gold-600" />
                  <span class="w-12 text-right text-sm tabular-nums text-ink-700">{{ Math.round(bodyFontSizeScale * 100)
                    }}%</span>
                </div>

                <label class="field-label">{{ t('carousel.fieldLineHeight') }}</label>
                <div class="flex items-center gap-3">
                  <input v-model.number="bodyLineHeight" type="range" min="1.15" max="2.25" step="0.05"
                    class="h-2 flex-1 cursor-pointer accent-gold-600" />
                  <span class="w-12 text-right text-sm tabular-nums text-ink-700">{{ bodyLineHeight.toFixed(2) }}</span>
                </div>
              </div>

              <!-- Preview + nav (right column when fullscreen; full width when not) -->
              <div class="order-1 flex min-w-0 flex-col gap-4 sm:order-none"
                :class="isPreviewFullscreen ? 'min-h-0 flex-1 overflow-hidden' : ''">
                <div class="flex justify-center"
                  :class="isPreviewFullscreen ? 'carousel-fs-preview-stage min-h-0 w-full flex-1 items-center' : ''">
                  <div ref="previewFrameRef"
                    class="carousel-preview-inner relative mx-auto overflow-hidden rounded-xl border border-ink-200 bg-ink-900 shadow-lg"
                    @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                    <div v-if="currentSlideProps" class="absolute left-1/2 top-1/2" :style="{
                      width: `${CAROUSEL_WIDTH}px`,
                      height: `${CAROUSEL_HEIGHT}px`,
                      transform: `translate(-50%, -50%) scale(${previewScale})`,
                    }">
                      <Transition name="carousel-preview" mode="out-in">
                        <div :key="`${currentIndex}-${theme}-${title}-${poemText.length}`" class="h-full w-full">
                          <CarouselSlide v-bind="currentSlideProps" />
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-center gap-3" :class="isPreviewFullscreen ? 'shrink-0' : ''">
                  <div class="flex items-center justify-center gap-3">
                    <button type="button"
                      class="rounded-full border border-ink-200 bg-white p-2 text-ink-700 hover:bg-ink-50"
                      :disabled="currentIndex <= 0" :aria-label="t('carousel.prev')" @click="currentIndex--">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div class="flex gap-1.5">
                      <button v-for="(_, i) in slideModels" :key="i" type="button"
                        class="h-2 w-2 rounded-full transition"
                        :class="i === currentIndex ? 'bg-gold-500 w-5' : 'bg-ink-300'"
                        :aria-label="t('carousel.goSlide', { n: i + 1 })" @click="currentIndex = i" />
                    </div>
                    <button type="button"
                      class="rounded-full border border-ink-200 bg-white p-2 text-ink-700 hover:bg-ink-50"
                      :disabled="currentIndex >= maxIndex" :aria-label="t('carousel.next')" @click="currentIndex++">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <p class="text-center text-xs text-ink-500">
                    {{ t('carousel.splitInfo', { n: bodySlideCount }) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden export mount -->
    <Teleport to="body">
      <div v-if="exporting && slidePropsFor(exportIndex)"
        class="pointer-events-none fixed -left-[9999px] top-0 z-[100] overflow-hidden"
        :style="{ width: `${CAROUSEL_WIDTH}px`, height: `${CAROUSEL_HEIGHT}px` }" aria-hidden="true">
        <CarouselSlide ref="captureRef" v-bind="slidePropsFor(exportIndex)!" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.carousel-preview-enter-active,
.carousel-preview-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.carousel-preview-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.carousel-preview-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

.defaults-thumbs-enter-active {
  animation: defaults-thumbs-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.defaults-thumbs-leave-active {
  transition: opacity 0.35s ease;
}

.defaults-thumbs-leave-to {
  opacity: 0;
}

@keyframes defaults-thumbs-in {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.4) rotate(-18deg);
  }

  55% {
    opacity: 1;
    transform: translateY(0) scale(1.12) rotate(8deg);
  }

  80% {
    transform: scale(0.96) rotate(-2deg);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
  }
}

.defaults-save-thumbs-icon {
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.12));
}

/* 4:5 preview — cap height to the viewport minus chrome (nav, sticky offset, shell header, padding). */
.carousel-preview-inner {
  aspect-ratio: 4 / 5;
  width: min(100%, 26.25rem, calc((100dvh - 15rem) * 4 / 5));
  max-height: calc(100dvh - 15rem);
}

.carousel-preview-shell:fullscreen,
.carousel-preview-shell:-webkit-full-screen {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.carousel-preview-shell:fullscreen .carousel-preview-fs-body,
.carousel-preview-shell:-webkit-full-screen .carousel-preview-fs-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

/* One row fills available height so the preview column can shrink-wrap the stage. */
.carousel-preview-shell:fullscreen .carousel-preview-fs-grid,
.carousel-preview-shell:-webkit-full-screen .carousel-preview-fs-grid {
  grid-template-rows: minmax(0, 1fr);
}

/* Flex column: preview stage grows; arrows stay below inside the column. */
.carousel-preview-shell:fullscreen .carousel-fs-preview-stage,
.carousel-preview-shell:-webkit-full-screen .carousel-fs-preview-stage {
  display: flex;
  flex: 1 1 0%;
  min-height: 0;
  align-items: center;
  justify-content: center;
}

/*
 * Explicit 4:5 size in fullscreen: width:auto + max-height:100% often collapses to 0.
 * Use viewport-based caps (~70dvh leaves room for header + arrows) and optional column width on sm+.
 */
.carousel-preview-shell:fullscreen .carousel-preview-inner,
.carousel-preview-shell:-webkit-full-screen .carousel-preview-inner {
  box-sizing: border-box;
  width: min(100%, calc(70dvh * 4 / 5));
  max-height: min(70dvh, calc(100dvh - 10rem));
  aspect-ratio: 4 / 5;
  height: auto;
}

@media (min-width: 640px) {

  .carousel-preview-shell:fullscreen .carousel-preview-inner,
  .carousel-preview-shell:-webkit-full-screen .carousel-preview-inner {
    width: min(100%, calc(100vw - 22rem), calc(70dvh * 4 / 5));
  }
}

/* Scroll when typography block is tall (e.g. fullscreen left column). */
.carousel-fullscreen-fonts {
  overflow-y: auto;
}
</style>
