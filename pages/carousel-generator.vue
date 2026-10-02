<script setup lang="ts">
import type { CarouselAspectRatioId, CarouselTheme } from '~/composables/useCarouselGenerator'
import { Icon } from '@iconify/vue'
import {
  buildCarouselSlides,
  buildInstagramCaption,
  CAROUSEL_ASPECT_RATIOS,
  CAROUSEL_THEME_IDS,
  CAROUSEL_LINES_PER_BODY_SLIDE,
  DEFAULT_CAROUSEL_ASPECT_RATIO_ID,
  downloadBlob,
  elementToPngBlob,
  blobsToZipDownload,
  fontScaleForBody,
  fontScaleForTitle,
  formatAuthorLifespan,
  getCarouselAspectRatio,
  slideFilename,
  splitPoemIntoSlides,
} from '~/composables/useCarouselGenerator'
import type { Poem } from '~/composables/usePoems'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'
import CarouselFontSelect from '~/components/carousel/CarouselFontSelect.vue'
import CarouselToolbarItem from '~/components/carousel/CarouselToolbarItem.vue'
import { CAROUSEL_MOBILE_CLEARANCE } from '~/utils/pageShell'
import { authorAvatarUrl } from '~/utils/authorAvatar'
import type { CarouselSiteDefaultsPayload } from '~/utils/carouselSiteDefaults'
import { CAROUSEL_FONT_WEIGHT_PRESETS } from '~/utils/carouselFontWeights'
import { parseStrictPoemWrittenYear } from '~/utils/carouselWrittenIn'
import {
  parsePoemCarouselSettings,
  type PoemCarouselSettingsPayload,
} from '~/utils/poemCarouselFontSettings'
import type { UserInstaPostPayload } from '~/utils/userInstaPost'
import { useAuth } from '~/composables/useAuth'
import { getFetchErrorDataCode, getFetchErrorStatus } from '~/utils/fetchApiError'
import { isStaffRole } from '~/utils/roles'

definePageMeta({
  layout: 'carousel',
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { user, fetchMe, isLoggedIn } = useAuth()

/** When true, slug watcher must not load sample content (user chose empty manual poem). */
const skipCarouselSampleLoad = ref(false)

const keywordsHelpOpen = ref(false)
const keywordsHelpWrapRef = ref<HTMLElement | null>(null)

function closeKeywordsHelpOnDocumentClick(e: MouseEvent) {
  if (!keywordsHelpOpen.value) return
  const w = keywordsHelpWrapRef.value
  if (w && !w.contains(e.target as Node)) keywordsHelpOpen.value = false
}

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
const aspectRatioId = ref<CarouselAspectRatioId>(DEFAULT_CAROUSEL_ASPECT_RATIO_ID)
const selectedAspectRatio = computed(() => getCarouselAspectRatio(aspectRatioId.value))
const carouselWidth = computed(() => selectedAspectRatio.value.width)
const carouselHeight = computed(() => selectedAspectRatio.value.height)
const carouselExportSizeLabel = computed(
  () => `${carouselWidth.value}×${carouselHeight.value}`,
)
const ctaText = ref('')
const keywordInput = ref('')
const keywords = computed(() =>
  keywordInput.value
    .split(/[,;]+/)
    .map((k) => k.trim())
    .filter(Boolean),
)

/** Verse layout (body slides). */
const linesPerSlide = ref(CAROUSEL_LINES_PER_BODY_SLIDE)
const bodyFontSizeScale = ref(1.5)
const bodyLineHeight = ref(1.65)
/** null = use theme Tailwind weights */
const bodyFontWeight = ref<number | null>(null)
const titleFontWeight = ref<number | null>(null)
/** Font stack for all carousel slide text (same catalog as poem reader). */
const carouselFontKey = ref<ReaderFontKey>('literata')
const carouselFontFamily = computed(() => READER_FONT_STACKS[carouselFontKey.value])

const carouselFontKeys = computed(() => Object.keys(READER_FONT_STACKS) as ReaderFontKey[])

function cycleCarouselFont(dir: -1 | 1) {
  const keys = carouselFontKeys.value
  if (!keys.length) return
  const idx = Math.max(0, keys.indexOf(carouselFontKey.value))
  const nextIdx = (idx + dir + keys.length) % keys.length
  carouselFontKey.value = keys[nextIdx]!
}

function prevCarouselFont() {
  cycleCarouselFont(-1)
}

function nextCarouselFont() {
  cycleCarouselFont(1)
}

const { data: siteDefaults } = await useFetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults', {
  key: 'carousel-site-defaults',
})

function applyCarouselTypographyFromSiteDefaults(d: CarouselSiteDefaultsPayload) {
  carouselFontKey.value = d.carouselFontKey
  linesPerSlide.value = d.linesPerSlide
  bodyFontSizeScale.value = d.bodyFontSizeScale
  bodyLineHeight.value = d.bodyLineHeight
  bodyFontWeight.value = d.bodyFontWeight ?? null
  titleFontWeight.value = d.titleFontWeight ?? null
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
  bodyFontWeight.value = p.bodyFontWeight ?? null
  titleFontWeight.value = p.titleFontWeight ?? null
  if (p.keywordInput !== undefined) keywordInput.value = p.keywordInput
}

/** Slug of the poem loaded from the library (route or search); used to save per-poem carousel. */
const loadedPoemSlug = ref<string | null>(null)
/** Saved Insta post id in the signed-in user's account (`?saved=`). */
const savedInstaPostId = ref<string | null>(null)
/** True when DB has saved carousel JSON for this poem — site defaults must not overwrite it. */
const poemCarouselOverridesFromDb = ref(false)

const isLibraryPoemContext = computed(() => {
  const q = route.query.slug
  const fromRoute = typeof q === 'string' && q.trim()
  return Boolean(fromRoute || loadedPoemSlug.value)
})

/** Custom title/body when no catalog poem is loaded (?slug= or search). */
const showManualPoemFields = computed(() => !isLibraryPoemContext.value)

/** Catalog poem: title & body editable only for admin / editor (API also allows moderator & site owner). */
const canEditCatalogTitleAndPoem = computed(
  () =>
    isLibraryPoemContext.value &&
    (user.value?.role === 'admin' || user.value?.role === 'editor'),
)

/** Title + poem inputs (manual draft, or catalog poem with edit permission). */
const showTitleAndPoemFields = computed(
  () => showManualPoemFields.value || canEditCatalogTitleAndPoem.value,
)

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

/** Set from GET /api/poems/:slug when a library poem is loaded; `null` = catalog poem with no submitter. */
const loadedPoemSubmittedByUserId = ref<string | null | undefined>(undefined)

/** Insta carousel staff save to catalog poem (administrators and moderators). */
const showCarouselStaffSaveCard = computed(() => isStaffRole(user.value?.role))

const carouselSaveFabTitle = computed(() => {
  if (savingCurrentPoemCarousel.value) return t('carousel.savingInstaPost')
  if (!isLoggedIn.value) return t('carousel.poemSaveLoginHint')
  if (!title.value.trim() || !poemText.value.trim()) return t('carousel.needTitleBody')
  return savedInstaPostId.value ? t('carousel.updateInstaPost') : t('carousel.saveInstaPost')
})

/** Reader URL on the author profile when this page was opened with a catalog poem (`?slug=`). */
const seePoemPageLocation = computed(() => {
  const poemSlug = loadedPoemSlug.value?.trim()
  const authorSlug = authorAvatarFromPoem.value?.slug?.trim()
  if (!poemSlug || !authorSlug) return null
  return {
    path: `/authors/${authorSlug}`,
    query: { poem: poemSlug },
  } as const
})

const savingCurrentPoemCarousel = ref(false)
const showCurrentPoemCarouselThumbsUp = ref(false)
let currentPoemCarouselThumbsHideTimer: ReturnType<typeof setTimeout> | null = null

const savingCatalogPoemContent = ref(false)
const catalogPoemContentJustSaved = ref(false)
let catalogPoemContentSavedHideTimer: ReturnType<typeof setTimeout> | null = null

async function saveCatalogPoemContent() {
  const slug = loadedPoemSlug.value?.trim()
  if (!slug || !canEditCatalogTitleAndPoem.value) return
  const tit = title.value.trim()
  const body = poemText.value.trim()
  if (!tit || !body) {
    alert(t('carousel.needTitleBody'))
    return
  }
  const wyRaw = poemWrittenYear.value.trim()
  let writtenYearPayload: number | null
  let writtenPeriodPayload: string | null
  if (!wyRaw) {
    writtenYearPayload = null
    writtenPeriodPayload = null
  } else {
    const strictYear = parseStrictPoemWrittenYear(wyRaw)
    if (strictYear != null) {
      writtenYearPayload = strictYear
      writtenPeriodPayload = null
    } else {
      if (wyRaw.length > 220) {
        alert(t('carousel.writtenPeriodTooLong'))
        return
      }
      writtenYearPayload = null
      writtenPeriodPayload = wyRaw
    }
  }
  savingCatalogPoemContent.value = true
  try {
    await $fetch(`/api/poems/${encodeURIComponent(slug)}/content`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: tit,
        content: body,
        writtenYear: writtenYearPayload,
        writtenPeriod: writtenPeriodPayload,
      },
    })
    if (catalogPoemContentSavedHideTimer) clearTimeout(catalogPoemContentSavedHideTimer)
    catalogPoemContentJustSaved.value = false
    await nextTick()
    catalogPoemContentJustSaved.value = true
    catalogPoemContentSavedHideTimer = setTimeout(() => {
      catalogPoemContentJustSaved.value = false
      catalogPoemContentSavedHideTimer = null
    }, 2400)
  } catch (e: unknown) {
    console.error(e)
    const statusCode = getFetchErrorStatus(e)
    const dataCode = getFetchErrorDataCode(e)
    const msg =
      statusCode === 401
        ? t('carousel.defaultsSaveError401')
        : statusCode === 403
          ? t('carousel.catalogPoemContentSaveForbidden')
          : statusCode === 409 || dataCode === 'DUPLICATE_POEM_TITLE'
            ? t('carousel.catalogPoemDuplicateTitle')
            : t('carousel.catalogPoemContentSaveError')
    alert(msg)
  } finally {
    savingCatalogPoemContent.value = false
  }
}

function buildInstaPostSaveBody(): UserInstaPostPayload {
  return {
    title: title.value.trim(),
    authorName: author.value.trim() || t('carousel.unknownAuthor'),
    poemText: poemText.value.trim(),
    poemSlug: loadedPoemSlug.value,
    aspectRatioId: aspectRatioId.value,
    ctaText: ctaText.value.trim() || undefined,
    poemWrittenYear: poemWrittenYear.value.trim() || null,
    authorNationality: authorNationality.value.trim() || null,
    authorBirthYear: authorBirthYear.value.trim() || null,
    authorDeathYear: authorDeathYear.value.trim() || null,
    theme: theme.value,
    carouselFontKey: carouselFontKey.value as UserInstaPostPayload['carouselFontKey'],
    linesPerSlide: linesPerSlide.value,
    bodyFontSizeScale: bodyFontSizeScale.value,
    bodyLineHeight: bodyLineHeight.value,
    bodyFontWeight: bodyFontWeight.value,
    titleFontWeight: titleFontWeight.value,
    keywordInput: keywordInput.value,
  }
}

async function saveStaffPoemCarouselSettings() {
  const slug = loadedPoemSlug.value
  if (!slug || !showCarouselStaffSaveCard.value) return
  await $fetch<PoemCarouselSettingsPayload>(`/api/poems/${encodeURIComponent(slug)}/carousel-font`, {
    method: 'PUT',
    credentials: 'include',
    body: {
      theme: theme.value,
      carouselFontKey: carouselFontKey.value as UserInstaPostPayload['carouselFontKey'],
      linesPerSlide: linesPerSlide.value,
      bodyFontSizeScale: bodyFontSizeScale.value,
      bodyLineHeight: bodyLineHeight.value,
      bodyFontWeight: bodyFontWeight.value,
      titleFontWeight: titleFontWeight.value,
      keywordInput: keywordInput.value,
    },
  })
  poemCarouselOverridesFromDb.value = true
}

async function saveInstaPostToAccount() {
  if (!isLoggedIn.value) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  const body = buildInstaPostSaveBody()
  if (!body.title || !body.poemText) {
    alert(t('carousel.needTitleBody'))
    return
  }
  savingCurrentPoemCarousel.value = true
  try {
    if (savedInstaPostId.value) {
      await $fetch(`/api/user/insta-posts/${encodeURIComponent(savedInstaPostId.value)}`, {
        method: 'PUT',
        credentials: 'include',
        body,
      })
    } else {
      const res = await $fetch<{ id: string }>('/api/user/insta-posts', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      savedInstaPostId.value = res.id
      await router.replace({ query: { ...route.query, saved: res.id } })
    }
    if (showCarouselStaffSaveCard.value && loadedPoemSlug.value) {
      await saveStaffPoemCarouselSettings()
    }
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
        : t('carousel.instaPostSaveError')
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

watch(
  () => slideModels.value.length,
  () => {
    if (currentIndex.value > maxIndex.value) currentIndex.value = maxIndex.value
  },
)

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

/** Cover slide “Written in …” — full phrase for free text; numeric-only strings use year template. */
function coverWrittenLineFromInput(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  const strictYear = parseStrictPoemWrittenYear(s)
  if (strictYear != null) return t('carousel.coverWrittenYear', { year: strictYear })
  return t('carousel.coverWrittenIn', { text: s })
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
  const writtenYearLine = coverWrittenLineFromInput(poemWrittenYear.value)
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
    bodyFontWeight: bodyFontWeight.value,
    titleFontWeight: titleFontWeight.value,
    canvasWidth: carouselWidth.value,
    canvasHeight: carouselHeight.value,
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

let previewResizeRaf: number | null = null

function updatePreviewFrameWidth() {
  const w = previewFrameRef.value?.clientWidth ?? 0
  const next = w > 0 ? w : 420
  if (previewFrameWidth.value !== next) previewFrameWidth.value = next
}

function schedulePreviewFrameWidthUpdate() {
  if (previewResizeRaf != null) return
  previewResizeRaf = requestAnimationFrame(() => {
    previewResizeRaf = null
    updatePreviewFrameWidth()
  })
}

let previewResizeObserver: ResizeObserver | null = null

watch(
  () => previewFrameRef.value,
  (el) => {
    previewResizeObserver?.disconnect()
    previewResizeObserver = null
    if (previewResizeRaf != null) {
      cancelAnimationFrame(previewResizeRaf)
      previewResizeRaf = null
    }
    if (!el) return
    updatePreviewFrameWidth()
    previewResizeObserver = new ResizeObserver(schedulePreviewFrameWidthUpdate)
    previewResizeObserver.observe(el)
  },
  { flush: 'post' },
)

const isPreviewModalOpen = ref(false)
const previewModalRef = ref<HTMLElement | null>(null)
const previewModalFrameRef = ref<HTMLElement | null>(null)
const previewModalFrameWidth = ref(420)

let previewModalResizeRaf: number | null = null
let previewModalResizeObserver: ResizeObserver | null = null

function updatePreviewModalFrameWidth() {
  const w = previewModalFrameRef.value?.clientWidth ?? 0
  const next = w > 0 ? w : 420
  if (previewModalFrameWidth.value !== next) previewModalFrameWidth.value = next
}

function schedulePreviewModalFrameWidthUpdate() {
  if (previewModalResizeRaf != null) return
  previewModalResizeRaf = requestAnimationFrame(() => {
    previewModalResizeRaf = null
    updatePreviewModalFrameWidth()
  })
}

function openPreviewModal() {
  isPreviewModalOpen.value = true
  nextTick(() => previewModalRef.value?.focus())
}

function closePreviewModal() {
  isPreviewModalOpen.value = false
}

function onPreviewModalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePreviewModal()
  }
}

watch(isPreviewModalOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(
  () => previewModalFrameRef.value,
  (el) => {
    previewModalResizeObserver?.disconnect()
    previewModalResizeObserver = null
    if (previewModalResizeRaf != null) {
      cancelAnimationFrame(previewModalResizeRaf)
      previewModalResizeRaf = null
    }
    if (!el) return
    updatePreviewModalFrameWidth()
    previewModalResizeObserver = new ResizeObserver(schedulePreviewModalFrameWidthUpdate)
    previewModalResizeObserver.observe(el)
  },
  { flush: 'post' },
)

onMounted(() => {
  document.addEventListener('click', closeKeywordsHelpOnDocumentClick)
  void fetchMe()
})

onUnmounted(() => {
  previewResizeObserver?.disconnect()
  previewModalResizeObserver?.disconnect()
  if (previewResizeRaf != null) cancelAnimationFrame(previewResizeRaf)
  if (previewModalResizeRaf != null) cancelAnimationFrame(previewModalResizeRaf)
  if (catalogPoemContentSavedHideTimer) clearTimeout(catalogPoemContentSavedHideTimer)
  if (currentPoemCarouselThumbsHideTimer) clearTimeout(currentPoemCarouselThumbsHideTimer)
  document.removeEventListener('click', closeKeywordsHelpOnDocumentClick)
  if (import.meta.client) document.body.style.overflow = ''
})

const previewScale = computed(() => {
  const w = previewFrameWidth.value
  return (w > 0 ? w : 420) / carouselWidth.value
})

const previewModalScale = computed(() => {
  const w = previewModalFrameWidth.value
  return (w > 0 ? w : 420) / carouselWidth.value
})

const previewInnerStyle = computed(() => {
  const r = selectedAspectRatio.value
  const [wR, hR] = r.cssRatio.split('/').map((part) => parseFloat(part.trim()))
  const maxHeight = 'calc(100dvh - 15rem)'
  return {
    aspectRatio: r.cssRatio,
    width: `min(100%, 26.25rem, calc(${maxHeight} * ${wR} / ${hR}))`,
    maxHeight,
  }
})

const previewModalInnerStyle = computed(() => {
  const r = selectedAspectRatio.value
  return {
    aspectRatio: r.cssRatio,
    height: '100%',
    width: 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
  }
})

const exportCanvasSize = computed(() => ({
  width: carouselWidth.value,
  height: carouselHeight.value,
}))

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
      const blob = await elementToPngBlob(el, { scale: 2, ...exportCanvasSize.value })
      files.push({ name: slideFilename(title.value, i), blob })
    }
    const zipName = `${title.value.replace(/\s+/g, '-').slice(0, 40) || 'poem'}-insta-post.zip`
    await blobsToZipDownload(files, zipName)
  } catch (e) {
    console.error(e)
    alert(t('carousel.exportError'))
  } finally {
    exporting.value = false
  }
}

async function exportCurrentPng() {
  if (!poemText.value.trim() || !title.value.trim()) {
    alert(t('carousel.needTitleBody'))
    return
  }
  exporting.value = true
  exportIndex.value = currentIndex.value
  try {
    await nextTick()
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    await document.fonts.ready
    const el = getCaptureRoot()
    if (!el) throw new Error('capture root')
    const blob = await elementToPngBlob(el, { scale: 2, ...exportCanvasSize.value })
    await downloadBlob(blob, slideFilename(title.value || 'poem', currentIndex.value))
  } catch (e) {
    console.error(e)
    alert(t('carousel.exportError'))
  } finally {
    exporting.value = false
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

async function loadFromSavedInstaPost(id: string) {
  try {
    const row = await $fetch<UserInstaPostPayload & { id: string; poemSlug?: string | null }>(
      `/api/user/insta-posts/${encodeURIComponent(id)}`,
      { credentials: 'include' },
    )
    skipCarouselSampleLoad.value = true
    savedInstaPostId.value = row.id
    title.value = row.title
    author.value = row.authorName
    poemText.value = row.poemText
    poemWrittenYear.value = row.poemWrittenYear || ''
    authorNationality.value = row.authorNationality || ''
    authorBirthYear.value = row.authorBirthYear || ''
    authorDeathYear.value = row.authorDeathYear || ''
    aspectRatioId.value = row.aspectRatioId
    if (row.ctaText) ctaText.value = row.ctaText
    applyPoemCarouselSettings(row)
    loadedPoemSlug.value = row.poemSlug || null
    loadedPoemSubmittedByUserId.value = undefined
    authorAvatarFromPoem.value = null
    if (row.poemSlug) {
      try {
        const full = await $fetch<Poem>(`/api/poems/${row.poemSlug}`)
        authorAvatarFromPoem.value = {
          slug: full.author.slug,
          name: full.author.name,
          imageUrl: full.author.imageUrl,
        }
        applyAuthorMetaFromApi(full.author)
        loadedPoemSubmittedByUserId.value = full.submittedByUserId ?? null
      } catch {
        /* keep saved author text */
      }
    }
    poemCarouselOverridesFromDb.value = true
    currentIndex.value = 0
  } catch (e) {
    console.error(e)
    savedInstaPostId.value = null
  }
}

async function loadFromSlug(slug: string) {
  savedInstaPostId.value = null
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
    poemWrittenYear.value =
      full.writtenPeriod?.trim() ||
      (full.writtenYear != null ? String(full.writtenYear) : '')
    loadedPoemSubmittedByUserId.value = full.submittedByUserId ?? null
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
    loadedPoemSubmittedByUserId.value = undefined
    poemCarouselOverridesFromDb.value = false
    if (!poemText.value.trim()) loadSample()
  }
}

function manualAuthorDefault() {
  const n = user.value?.name?.trim()
  return n || t('carousel.sampleAuthor')
}

function loadSample() {
  loadedPoemSlug.value = null
  savedInstaPostId.value = null
  loadedPoemSubmittedByUserId.value = undefined
  poemCarouselOverridesFromDb.value = false
  title.value = t('carousel.sampleTitle')
  author.value = manualAuthorDefault()
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
  () => [route.query.saved, route.query.slug] as const,
  async ([saved, slug]) => {
    if (typeof saved === 'string' && saved.trim()) {
      await loadFromSavedInstaPost(saved.trim())
      return
    }
    savedInstaPostId.value = null
    if (typeof slug === 'string' && slug.trim()) {
      await loadFromSlug(slug.trim())
      return
    }
    loadedPoemSlug.value = null
    loadedPoemSubmittedByUserId.value = undefined
    poemCarouselOverridesFromDb.value = false
    if (siteDefaults.value) applyCarouselSiteDefaults(siteDefaults.value)
    if (!poemText.value.trim() && !skipCarouselSampleLoad.value) loadSample()
  },
  { immediate: true },
)

/** When session loads after SSR, replace placeholder sample author with the signed-in name. */
watch(
  () => [user.value?.name, showManualPoemFields.value, locale.value] as const,
  () => {
    if (!showManualPoemFields.value) return
    const n = user.value?.name?.trim()
    if (!n) return
    if (author.value === t('carousel.sampleAuthor')) {
      author.value = n
    }
  },
)

async function switchToOwnPoem() {
  skipCarouselSampleLoad.value = true
  savedInstaPostId.value = null
  title.value = ''
  author.value = user.value?.name?.trim() || ''
  authorNationality.value = ''
  authorBirthYear.value = ''
  authorDeathYear.value = ''
  poemWrittenYear.value = ''
  poemText.value = ''
  authorAvatarFromPoem.value = null
  loadedPoemSubmittedByUserId.value = undefined
  poemCarouselOverridesFromDb.value = false
  currentIndex.value = 0

  const q = { ...route.query } as Record<string, string | string[] | null | undefined>
  delete q.slug
  delete q.saved
  await router.replace({ path: route.path, query: q as typeof route.query })

  if (siteDefaults.value) applyCarouselSiteDefaults(siteDefaults.value)
  await nextTick()
  skipCarouselSampleLoad.value = false
}

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
  <div class="carousel-page" :class="CAROUSEL_MOBILE_CLEARANCE">
    <header class="carousel-page__header">
      <p class="ds-eyebrow mb-2">{{ t('carousel.seoTitle') }}</p>
      <h1 class="carousel-page__title">
        {{ t('carousel.title') }}
      </h1>
      <p class="carousel-page__subtitle">
        {{ t('carousel.subtitle') }}
      </p>
    </header>

    <!-- Tools bar: poem source + save/export actions -->
    <div class="carousel-page__toolbar" aria-label="Instrumente post Insta">
      <div class="carousel-page__toolbar-row">
        <div class="carousel-page__toolbar-left">
          <span
            class="carousel-page__toolbar-icon"
            aria-hidden="true">
            <Icon :icon="loadedPoemSlug ? 'heroicons:book-open' : 'heroicons:pencil-square'" class="carousel-page__icon-sm" />
          </span>
          <span class="carousel-page__toolbar-meta">
            <span class="carousel-page__toolbar-name">
              {{ loadedPoemSlug ? (title || t('carousel.untitled')) : t('carousel.sectionManualPoem') }}
            </span>
            <span class="carousel-page__toolbar-source">
              {{ loadedPoemSlug ? t('carousel.sourceLibrary') : t('carousel.sourceOwn') }}
            </span>
          </span>
          <NuxtLink v-if="seePoemPageLocation" :to="seePoemPageLocation" class="ds-link ds-link--sm ds-link--inline carousel-page__toolbar-link">
            {{ t('carousel.seePoem') }}
          </NuxtLink>
          <button v-if="loadedPoemSlug" type="button" class="ds-btn-secondary ds-btn--xs carousel-page__toolbar-link"
            @click="switchToOwnPoem">
            {{ t('carousel.writeOwnPoem') }}
          </button>
        </div>

        <div class="carousel-page__toolbar-right">
          <Transition name="carousel-saved-flash">
            <span v-if="showCurrentPoemCarouselThumbsUp"
              class="carousel-page__saved" role="status" aria-live="polite">
              <Icon icon="heroicons:check-circle" class="carousel-page__icon-sm" aria-hidden="true" />
              {{ t('carousel.savedShort') }}
              <span class="sr-only">{{ t('carousel.instaPostSaved') }}</span>
            </span>
          </Transition>
          <button type="button" class="ds-btn-secondary"
            :disabled="savingCurrentPoemCarousel" :title="carouselSaveFabTitle" :aria-label="carouselSaveFabTitle"
            @click="saveInstaPostToAccount">
            <span v-if="savingCurrentPoemCarousel"
              class="ph-spinner"
              aria-hidden="true" />
            <Icon v-else icon="heroicons:bookmark-square" class="carousel-page__icon-sm" aria-hidden="true" />
            {{ t('carousel.toolbarSave') }}
          </button>
          <button type="button" class="ds-btn-secondary carousel-page__desktop-only"
            :disabled="exporting" :title="t('carousel.downloadCurrent')" @click="exportCurrentPng">
            <Icon icon="heroicons:photo" class="carousel-page__icon-sm" aria-hidden="true" />
            {{ t('carousel.downloadCurrentShort') }}
          </button>
          <button type="button" class="ds-btn-primary carousel-page__desktop-only"
            :disabled="exporting" :title="t('carousel.exportHint', { size: carouselExportSizeLabel })"
            @click="exportZip">
            <Icon icon="heroicons:arrow-down-tray" class="carousel-page__icon-sm" aria-hidden="true" />
            {{ exporting ? t('carousel.exporting') : t('carousel.downloadZipShort') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop: poem | settings | preview; mobile: preview first, then stacked controls -->
    <div class="carousel-page__layout">
      <!-- Column 1: Poem content -->
      <div class="carousel-page__col carousel-page__col--poem">
        <section v-if="showTitleAndPoemFields" class="ds-card carousel-page__card">
          <p class="ds-eyebrow">
            {{ showManualPoemFields ? t('carousel.sectionManualPoem') : t('carousel.sectionCatalogPoemEdit') }}
          </p>
          <p v-if="canEditCatalogTitleAndPoem && !showManualPoemFields"
            class="carousel-page__hint">
            {{ t('carousel.catalogPoemEditHint') }}
          </p>
          <div class="carousel-page__stack">
            <div v-if="showManualPoemFields">
              <label class="field-label" for="carousel-manual-author">{{ t('carousel.fieldAuthor') }}</label>
              <input id="carousel-manual-author" v-model="author" type="text" class="ds-input"
                :placeholder="t('carousel.phAuthor')" autocomplete="off" />
            </div>
            <div>
              <label class="field-label" for="carousel-manual-title">{{ t('carousel.fieldTitle') }}</label>
              <input id="carousel-manual-title" v-model="title" type="text" class="ds-input"
                :placeholder="t('carousel.phTitle')" autocomplete="off" />
            </div>
            <div>
              <label class="field-label" for="carousel-manual-poem">{{ t('carousel.fieldPoem') }}</label>
              <textarea id="carousel-manual-poem" v-model="poemText" rows="12"
                class="ds-input carousel-page__poem-textarea" :placeholder="t('carousel.phPoem')"
                spellcheck="true" />
            </div>
            <div>
              <label class="field-label" for="carousel-written-year">{{ t('carousel.fieldPoemWrittenYear') }}</label>
              <input id="carousel-written-year" v-model="poemWrittenYear" type="text" inputmode="numeric" maxlength="12"
                class="ds-input carousel-page__year-input" :placeholder="t('carousel.phPoemWrittenYear')"
                autocomplete="off" />
              <p class="carousel-page__hint carousel-page__hint--tight">{{ t('carousel.writtenYearHint') }}</p>
            </div>
            <div v-if="canEditCatalogTitleAndPoem && loadedPoemSlug" class="carousel-page__inline-actions">
              <button type="button" class="ds-btn-secondary" :disabled="savingCatalogPoemContent"
                @click="saveCatalogPoemContent">
                <span v-if="savingCatalogPoemContent"
                  class="ph-spinner"
                  aria-hidden="true" />
                {{ savingCatalogPoemContent ? t('carousel.savingCatalogPoemContent') :
                  t('carousel.saveCatalogPoemContent')
                }}
              </button>
              <span v-if="catalogPoemContentJustSaved" class="carousel-page__success" role="status">{{
                t('carousel.catalogPoemContentSaved') }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Column 2: Style, typography, caption -->
      <div class="carousel-page__col carousel-page__col--settings">
        <!-- Style: font, theme, keyword highlights -->
        <section class="ds-card carousel-page__card">
          <p class="ds-eyebrow">
            {{ t('carousel.sectionInstagramPostSettings') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldFont') }}</label>
          <div class="carousel-page__font-row">
            <button type="button" class="ds-icon-btn" :disabled="carouselFontKeys.length < 2"
              aria-label="Font anterior" title="Font anterior" @click="prevCarouselFont">
              <Icon icon="heroicons:chevron-left" class="carousel-page__icon-md" aria-hidden="true" />
            </button>
            <CarouselFontSelect v-model="carouselFontKey" class="carousel-page__font-select" />
            <button type="button" class="ds-icon-btn" :disabled="carouselFontKeys.length < 2"
              aria-label="Font următor" title="Font următor" @click="nextCarouselFont">
              <Icon icon="heroicons:chevron-right" class="carousel-page__icon-md" aria-hidden="true" />
            </button>
          </div>
          <p class="carousel-page__hint carousel-page__hint--section">
            {{ t('carousel.fontCarouselHint') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldTheme') }}</label>
          <div class="carousel-page__theme-row">
            <button v-for="th in CAROUSEL_THEME_IDS" :key="th" type="button"
              class="carousel-page__theme-btn" :class="theme === th
                ? 'carousel-page__theme-btn--active'
                : ''
                " :aria-pressed="theme === th" @click="theme = th">
              {{ t(`carousel.theme.${th}`) }}
            </button>
          </div>

          <div ref="keywordsHelpWrapRef" class="carousel-page__kw-wrap">
            <div class="carousel-page__kw-head">
              <label class="field-label carousel-page__kw-label" for="carousel-keyword-input">{{ t('carousel.fieldKeywords')
              }}</label>
              <button id="carousel-keywords-help-trigger" type="button"
                class="carousel-page__kw-help-btn"
                :aria-expanded="keywordsHelpOpen" aria-controls="carousel-keywords-help-panel"
                :aria-label="t('carousel.keywordsHelpAriaLabel')" @click.stop="keywordsHelpOpen = !keywordsHelpOpen">
                <svg class="carousel-page__icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"
                  aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </button>
            </div>
            <Transition name="carousel-kw-help">
              <div v-show="keywordsHelpOpen" id="carousel-keywords-help-panel"
                class="carousel-page__kw-panel"
                role="region" @click.stop>
                {{ t('carousel.keywordsHelp') }}
              </div>
            </Transition>
          </div>
          <input id="carousel-keyword-input" v-model="keywordInput" type="text" class="ds-input"
            :placeholder="t('carousel.phKeywords')" />
        </section>

        <!-- Verse layout / typography -->
        <section class="ds-card carousel-page__card">
          <p class="ds-eyebrow">
            {{ t('carousel.sectionTypography') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldLinesPerSlide') }}</label>
          <div class="carousel-page__range-row">
            <input v-model.number="linesPerSlide" type="range" min="4" max="16" step="1"
              class="carousel-page__range" />
            <span class="carousel-page__range-val">{{ linesPerSlide }}</span>
          </div>

          <label class="field-label">{{ t('carousel.fieldBodyFontSize') }}</label>
          <div class="carousel-page__range-row">
            <input v-model.number="bodyFontSizeScale" type="range" min="0.7" max="2" step="0.05"
              class="carousel-page__range" />
            <span class="carousel-page__range-val carousel-page__range-val--wide">{{ Math.round(bodyFontSizeScale
              * 100)
              }}%</span>
          </div>

          <label class="field-label">{{ t('carousel.fieldLineHeight') }}</label>
          <div class="carousel-page__range-row">
            <input v-model.number="bodyLineHeight" type="range" min="1.15" max="2.25" step="0.05"
              class="carousel-page__range" />
            <span class="carousel-page__range-val carousel-page__range-val--wide">{{ bodyLineHeight.toFixed(2)
              }}</span>
          </div>

          <div class="carousel-page__weight-grid">
            <div>
              <label class="field-label" for="carousel-body-font-weight">{{ t('carousel.fieldBodyFontWeight') }}</label>
              <select id="carousel-body-font-weight" class="ds-input" :value="bodyFontWeight ?? ''"
                @change="bodyFontWeight = ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value)">
                <option value="">{{ t('carousel.fontWeightDefault') }}</option>
                <option v-for="w in CAROUSEL_FONT_WEIGHT_PRESETS" :key="w" :value="w">{{ t(`carousel.fontWeight.${w}`)
                  }}</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="carousel-title-font-weight">{{ t('carousel.fieldTitleFontWeight')
              }}</label>
              <select id="carousel-title-font-weight" class="ds-input" :value="titleFontWeight ?? ''"
                @change="titleFontWeight = ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value)">
                <option value="">{{ t('carousel.fontWeightDefault') }}</option>
                <option v-for="w in CAROUSEL_FONT_WEIGHT_PRESETS" :key="w" :value="w">{{ t(`carousel.fontWeight.${w}`)
                  }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Instagram caption -->
        <section class="ds-card carousel-page__card">
          <div class="carousel-page__caption-head">
            <p class="ds-eyebrow mb-0">
              {{ t('carousel.sectionCaption') }}
            </p>
            <button type="button"
              class="carousel-page__caption-copy"
              @click="copyCaption">
              <Icon icon="heroicons:clipboard-document" class="carousel-page__icon-sm" aria-hidden="true" />
              {{ t('carousel.copyCaption') }}
            </button>
          </div>
          <pre
            class="carousel-page__caption-pre">{{
              captionText }}</pre>
          <p class="carousel-page__hint carousel-page__hint--tight">
            {{ t('carousel.exportHint', { size: carouselExportSizeLabel }) }}
          </p>
        </section>
      </div>

      <!-- Column 3: Preview -->
      <div
        class="carousel-page__col carousel-page__col--preview">
        <div class="carousel-page__preview-stack">
          <div class="carousel-page__preview-row">
            <aside
              class="carousel-page__preview-toolbar"
              :aria-label="t('carousel.previewToolbar')">
              <CarouselToolbarItem v-for="ratio in CAROUSEL_ASPECT_RATIOS" :key="ratio.id"
                :label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                :hint="t(`carousel.aspectRatio.${ratio.i18nKey}.hint`, { size: `${ratio.width}×${ratio.height}` })"
                placement="right">
                <button type="button"
                  class="carousel-page__aspect-btn"
                  :class="aspectRatioId === ratio.id
                    ? 'carousel-page__aspect-btn--active'
                    : ''"
                  :aria-pressed="aspectRatioId === ratio.id"
                  :aria-label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)" @click="aspectRatioId = ratio.id">
                  {{ ratio.id }}
                </button>
              </CarouselToolbarItem>
            </aside>

            <div class="carousel-page__preview-center">
              <div ref="previewFrameRef"
                class="carousel-page__preview-frame"
                :style="previewInnerStyle" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                <div v-if="currentSlideProps" class="carousel-page__preview-slide" :style="{
                  width: `${carouselWidth}px`,
                  height: `${carouselHeight}px`,
                  transform: `translate(-50%, -50%) scale(${previewScale})`,
                }">
                  <Transition name="carousel-preview" mode="out-in">
                    <div
                      :key="`${aspectRatioId}-${currentIndex}-${theme}-${title}-${poemText.length}-${bodyFontWeight}-${titleFontWeight}`"
                      class="carousel-page__preview-fill">
                      <CarouselSlide v-bind="currentSlideProps" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <aside
              class="carousel-page__preview-toolbar"
              :aria-label="t('carousel.previewExportToolbar')">
              <CarouselToolbarItem :label="t('carousel.enterFullScreen')" :hint="t('carousel.toolbarFullScreenHint')"
                placement="left">
                <button type="button" class="ds-icon-btn"
                  :aria-label="t('carousel.enterFullScreen')" @click="openPreviewModal">
                  <svg class="carousel-page__icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 8V4m0 0h4M4 16v4m0 0h4m8-16h4m0 0v4m0 4v4m0 4h-4m-8 0H4" />
                  </svg>
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="t('carousel.downloadCurrent')"
                :hint="t('carousel.toolbarExportPngHint', { size: carouselExportSizeLabel })" placement="left">
                <button type="button" class="ds-icon-btn" :disabled="exporting"
                  :aria-label="t('carousel.downloadCurrent')" @click="exportCurrentPng">
                  <Icon icon="heroicons:photo" class="carousel-page__icon-sm" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="exporting ? t('carousel.exporting') : t('carousel.downloadZip')"
                :hint="t('carousel.toolbarExportZipHint')" placement="left">
                <button type="button" class="ds-icon-btn" :disabled="exporting"
                  :aria-label="exporting ? t('carousel.exporting') : t('carousel.downloadZipShort')" @click="exportZip">
                  <Icon icon="heroicons:arrow-down-tray" class="carousel-page__icon-sm" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
            </aside>
          </div>

          <div class="carousel-page__nav">
            <div class="carousel-page__nav-row">
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex <= 0" :aria-label="t('carousel.prev')" @click="currentIndex--">
                <svg class="carousel-page__icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div class="carousel-page__dots">
                <button v-for="(_, i) in slideModels" :key="i" type="button" class="carousel-page__dot"
                  :class="i === currentIndex ? 'carousel-page__dot--active' : ''"
                  :aria-label="t('carousel.goSlide', { n: i + 1 })" @click="currentIndex = i" />
              </div>
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex >= maxIndex" :aria-label="t('carousel.next')" @click="currentIndex++">
                <svg class="carousel-page__icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p class="carousel-page__nav-count">
                {{ currentIndex + 1 }} / {{ slideModels.length }}
              </p>
            </div>

            <p class="carousel-page__nav-info">
              {{ t('carousel.splitInfo', { n: bodySlideCount }) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enlarged preview modal -->
    <Teleport to="body">
      <div v-if="isPreviewModalOpen" class="carousel-page__modal">
        <button type="button" class="carousel-page__modal-backdrop"
          :aria-label="t('carousel.exitFullScreen')" @click="closePreviewModal" />

        <div ref="previewModalRef" role="dialog" aria-modal="true" :aria-label="t('carousel.preview')" tabindex="-1"
          class="carousel-page__modal-panel"
          @keydown="onPreviewModalKeydown" @click.stop>
          <div class="carousel-page__modal-head">
            <h2 class="carousel-page__modal-title">
              {{ t('carousel.preview') }}
            </h2>
            <CloseButton :label="t('carousel.exitFullScreen')" @click="closePreviewModal" />
          </div>

          <div class="carousel-page__modal-body">
            <aside
              class="carousel-page__preview-toolbar"
              :aria-label="t('carousel.previewToolbar')">
              <CarouselToolbarItem v-for="ratio in CAROUSEL_ASPECT_RATIOS" :key="`modal-ratio-${ratio.id}`"
                :label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                :hint="t(`carousel.aspectRatio.${ratio.i18nKey}.hint`, { size: `${ratio.width}×${ratio.height}` })"
                placement="right">
                <button type="button"
                  class="carousel-page__aspect-btn"
                  :class="aspectRatioId === ratio.id
                    ? 'carousel-page__aspect-btn--active'
                    : ''"
                  :aria-pressed="aspectRatioId === ratio.id"
                  :aria-label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)" @click="aspectRatioId = ratio.id">
                  {{ ratio.id }}
                </button>
              </CarouselToolbarItem>
            </aside>

            <div class="carousel-page__modal-preview">
              <div ref="previewModalFrameRef"
                class="carousel-page__preview-frame"
                :style="previewModalInnerStyle" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                <div v-if="currentSlideProps" class="carousel-page__preview-slide" :style="{
                  width: `${carouselWidth}px`,
                  height: `${carouselHeight}px`,
                  transform: `translate(-50%, -50%) scale(${previewModalScale})`,
                }">
                  <Transition name="carousel-preview" mode="out-in">
                    <div
                      :key="`modal-${aspectRatioId}-${currentIndex}-${theme}-${title}-${poemText.length}-${bodyFontWeight}-${titleFontWeight}`"
                      class="carousel-page__preview-fill">
                      <CarouselSlide v-bind="currentSlideProps" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <aside
              class="carousel-page__preview-toolbar"
              :aria-label="t('carousel.previewExportToolbar')">
              <CarouselToolbarItem :label="t('carousel.exitFullScreen')" :hint="t('carousel.toolbarFullScreenExitHint')"
                placement="left">
                <button type="button" class="ds-icon-btn"
                  :aria-label="t('carousel.exitFullScreen')" @click="closePreviewModal">
                  <svg class="carousel-page__icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="t('carousel.downloadCurrent')"
                :hint="t('carousel.toolbarExportPngHint', { size: carouselExportSizeLabel })" placement="left">
                <button type="button" class="ds-icon-btn" :disabled="exporting"
                  :aria-label="t('carousel.downloadCurrent')" @click="exportCurrentPng">
                  <Icon icon="heroicons:photo" class="carousel-page__icon-sm" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="exporting ? t('carousel.exporting') : t('carousel.downloadZip')"
                :hint="t('carousel.toolbarExportZipHint')" placement="left">
                <button type="button" class="ds-icon-btn" :disabled="exporting"
                  :aria-label="exporting ? t('carousel.exporting') : t('carousel.downloadZipShort')" @click="exportZip">
                  <Icon icon="heroicons:arrow-down-tray" class="carousel-page__icon-sm" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
            </aside>
          </div>

          <div class="carousel-page__nav">
            <div class="carousel-page__nav-row">
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex <= 0" :aria-label="t('carousel.prev')" @click="currentIndex--">
                <svg class="carousel-page__icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div class="carousel-page__dots">
                <button v-for="(_, i) in slideModels" :key="`modal-dot-${i}`" type="button"
                  class="carousel-page__dot"
                  :class="i === currentIndex ? 'carousel-page__dot--active' : ''"
                  :aria-label="t('carousel.goSlide', { n: i + 1 })" @click="currentIndex = i" />
              </div>
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex >= maxIndex" :aria-label="t('carousel.next')" @click="currentIndex++">
                <svg class="carousel-page__icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p class="carousel-page__nav-count">
                {{ currentIndex + 1 }} / {{ slideModels.length }}
              </p>
            </div>

            <p class="carousel-page__nav-info">
              {{ t('carousel.splitInfo', { n: bodySlideCount }) }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile export bar (desktop actions live in the tools bar) -->
    <div
      class="carousel-page__mobile-bar">
      <div class="carousel-page__mobile-bar-inner">
        <button type="button" class="ds-btn-secondary" :disabled="exporting"
          @click="exportCurrentPng">
          <Icon icon="heroicons:photo" class="carousel-page__icon-sm" aria-hidden="true" />
          {{ exporting ? t('carousel.exporting') : t('carousel.downloadCurrentShort') }}
        </button>
        <button type="button" class="ds-btn-primary" :disabled="exporting"
          @click="exportZip">
          <Icon icon="heroicons:arrow-down-tray" class="carousel-page__icon-sm" aria-hidden="true" />
          {{ exporting ? t('carousel.exporting') : t('carousel.downloadZipShort') }}
        </button>
      </div>
    </div>

    <!-- Hidden export mount -->
    <Teleport to="body">
      <div v-if="exporting && slidePropsFor(exportIndex)"
        class="carousel-page__export-mount"
        :style="{ width: `${carouselWidth}px`, height: `${carouselHeight}px` }" aria-hidden="true">
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

.carousel-saved-flash-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.carousel-saved-flash-leave-active {
  transition: opacity 0.35s ease;
}

.carousel-saved-flash-enter-from {
  opacity: 0;
  transform: translateX(4px);
}

.carousel-saved-flash-leave-to {
  opacity: 0;
}

/* Preview frame sizing is driven inline from the selected Instagram aspect ratio. */
.carousel-page__preview-frame {
  box-sizing: border-box;
}

.carousel-page__preview-toolbar {
  height: auto;
  align-self: flex-start;
}

.carousel-kw-help-enter-active,
.carousel-kw-help-leave-active {
  transition: opacity 0.15s ease;
}

.carousel-kw-help-enter-from,
.carousel-kw-help-leave-to {
  opacity: 0;
}
</style>
