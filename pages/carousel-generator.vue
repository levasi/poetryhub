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
  layout: 'default',
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
  <div class="w-full min-w-0 pb-24 pt-2 md:pb-16 md:pt-4">
    <header class="mb-4 max-w-reading">
      <p class="ds-eyebrow mb-2">{{ t('carousel.seoTitle') }}</p>
      <h1 class="font-serif text-2xl font-semibold tracking-tight text-content md:text-3xl">
        {{ t('carousel.title') }}
      </h1>
      <p class="mt-2 text-sm leading-relaxed text-content-secondary">
        {{ t('carousel.subtitle') }}
      </p>
    </header>

    <!-- Tools bar: poem source + save/export actions -->
    <div class="mb-8 border-b border-edge-subtle py-3 md:py-4" aria-label="Instrumente post Insta">
      <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-content-muted"
            aria-hidden="true">
            <Icon :icon="loadedPoemSlug ? 'heroicons:book-open' : 'heroicons:pencil-square'" class="h-4 w-4 shrink-0" />
          </span>
          <span class="min-w-0 max-w-[16rem]">
            <span class="block truncate text-sm font-semibold leading-tight text-content">
              {{ loadedPoemSlug ? (title || t('carousel.untitled')) : t('carousel.sectionManualPoem') }}
            </span>
            <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-content-soft">
              {{ loadedPoemSlug ? t('carousel.sourceLibrary') : t('carousel.sourceOwn') }}
            </span>
          </span>
          <NuxtLink v-if="seePoemPageLocation" :to="seePoemPageLocation" class="ds-link ml-1 text-sm underline">
            {{ t('carousel.seePoem') }}
          </NuxtLink>
          <button v-if="loadedPoemSlug" type="button" class="ds-btn-secondary ml-1 px-3 py-1.5 text-xs"
            @click="switchToOwnPoem">
            {{ t('carousel.writeOwnPoem') }}
          </button>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <Transition name="carousel-saved-flash">
            <span v-if="showCurrentPoemCarouselThumbsUp"
              class="inline-flex items-center gap-1 text-sm font-medium text-success" role="status" aria-live="polite">
              <Icon icon="heroicons:check-circle" class="h-4 w-4 shrink-0" aria-hidden="true" />
              {{ t('carousel.savedShort') }}
              <span class="sr-only">{{ t('carousel.instaPostSaved') }}</span>
            </span>
          </Transition>
          <button type="button" class="ds-btn-secondary gap-2 px-4 py-2 text-sm shadow-ds-card"
            :disabled="savingCurrentPoemCarousel" :title="carouselSaveFabTitle"
            :aria-label="carouselSaveFabTitle" @click="saveInstaPostToAccount">
            <span v-if="savingCurrentPoemCarousel"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
              aria-hidden="true" />
            <Icon v-else icon="heroicons:bookmark-square" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ t('carousel.toolbarSave') }}
          </button>
          <button type="button" class="ds-btn-secondary hidden gap-2 px-4 py-2 text-sm shadow-ds-card md:inline-flex"
            :disabled="exporting" :title="t('carousel.downloadCurrent')" @click="exportCurrentPng">
            <Icon icon="heroicons:photo" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ t('carousel.downloadCurrentShort') }}
          </button>
          <button type="button" class="ds-btn-primary hidden gap-2 px-4 py-2 text-sm shadow-ds-card md:inline-flex"
            :disabled="exporting" :title="t('carousel.exportHint', { size: carouselExportSizeLabel })"
            @click="exportZip">
            <Icon icon="heroicons:arrow-down-tray" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ exporting ? t('carousel.exporting') : t('carousel.downloadZipShort') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop: poem | settings | preview; mobile: preview first, then stacked controls -->
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start lg:gap-8 xl:gap-10">
      <!-- Column 1: Poem content -->
      <div class="order-2 min-w-0 space-y-6 lg:order-none">
        <section v-if="showTitleAndPoemFields" class="ds-card p-5 md:p-6">
          <p class="ds-eyebrow">
            {{ showManualPoemFields ? t('carousel.sectionManualPoem') : t('carousel.sectionCatalogPoemEdit') }}
          </p>
          <p v-if="canEditCatalogTitleAndPoem && !showManualPoemFields"
            class="mb-4 text-xs leading-relaxed text-content-muted">
            {{ t('carousel.catalogPoemEditHint') }}
          </p>
          <div class="space-y-4">
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
                class="ds-input min-h-[12rem] resize-y font-serif leading-relaxed" :placeholder="t('carousel.phPoem')"
                spellcheck="true" />
            </div>
            <div>
              <label class="field-label" for="carousel-written-year">{{ t('carousel.fieldPoemWrittenYear') }}</label>
              <input id="carousel-written-year" v-model="poemWrittenYear" type="text" inputmode="numeric" maxlength="12"
                class="ds-input max-w-xs tabular-nums" :placeholder="t('carousel.phPoemWrittenYear')"
                autocomplete="off" />
              <p class="mt-1.5 text-xs leading-relaxed text-content-muted">{{ t('carousel.writtenYearHint') }}</p>
            </div>
            <div v-if="canEditCatalogTitleAndPoem && loadedPoemSlug" class="flex flex-wrap items-center gap-3 pt-1">
              <button type="button" class="ds-btn-secondary gap-2" :disabled="savingCatalogPoemContent"
                @click="saveCatalogPoemContent">
                <span v-if="savingCatalogPoemContent"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
                  aria-hidden="true" />
                {{ savingCatalogPoemContent ? t('carousel.savingCatalogPoemContent') :
                  t('carousel.saveCatalogPoemContent')
                }}
              </button>
              <span v-if="catalogPoemContentJustSaved" class="text-sm font-medium text-success" role="status">{{
                t('carousel.catalogPoemContentSaved') }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Column 2: Style, typography, caption -->
      <div class="order-3 min-w-0 space-y-6 lg:order-none">
        <!-- Style: font, theme, keyword highlights -->
        <section class="ds-card p-5 md:p-6">
          <p class="ds-eyebrow">
            {{ t('carousel.sectionInstagramPostSettings') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldFont') }}</label>
          <div class="mb-2 flex items-center gap-2">
            <button type="button" class="ds-icon-btn shrink-0 rounded-ds-md" :disabled="carouselFontKeys.length < 2"
              aria-label="Font anterior" title="Font anterior" @click="prevCarouselFont">
              <Icon icon="heroicons:chevron-left" class="h-5 w-5" aria-hidden="true" />
            </button>
            <CarouselFontSelect v-model="carouselFontKey" class="min-w-0 flex-1" />
            <button type="button" class="ds-icon-btn shrink-0 rounded-ds-md" :disabled="carouselFontKeys.length < 2"
              aria-label="Font următor" title="Font următor" @click="nextCarouselFont">
              <Icon icon="heroicons:chevron-right" class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p class="mb-5 text-xs leading-relaxed text-content-muted">
            {{ t('carousel.fontCarouselHint') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldTheme') }}</label>
          <div class="mb-5 flex flex-wrap gap-2">
            <button v-for="th in CAROUSEL_THEME_IDS" :key="th" type="button"
              class="rounded-full border px-4 py-1.5 text-sm transition" :class="theme === th
                ? 'border-brand bg-brand font-medium text-brand-foreground'
                : 'border-edge-subtle bg-surface-subtle text-content-secondary hover:border-edge hover:text-content'
                " :aria-pressed="theme === th" @click="theme = th">
              {{ t(`carousel.theme.${th}`) }}
            </button>
          </div>

          <div ref="keywordsHelpWrapRef" class="relative mb-1">
            <div class="flex items-baseline gap-1.5">
              <label class="field-label mb-0 flex-1" for="carousel-keyword-input">{{ t('carousel.fieldKeywords')
                }}</label>
              <button id="carousel-keywords-help-trigger" type="button"
                class="inline-flex shrink-0 rounded-full p-0.5 text-content-soft transition hover:bg-surface-subtle hover:text-content-secondary"
                :aria-expanded="keywordsHelpOpen" aria-controls="carousel-keywords-help-panel"
                :aria-label="t('carousel.keywordsHelpAriaLabel')" @click.stop="keywordsHelpOpen = !keywordsHelpOpen">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"
                  aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </button>
            </div>
            <Transition name="carousel-kw-help">
              <div v-show="keywordsHelpOpen" id="carousel-keywords-help-panel"
                class="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-ds-md border border-edge-subtle bg-surface-overlay p-3 text-xs leading-relaxed text-content-muted shadow-ds-popover"
                role="region" @click.stop>
                {{ t('carousel.keywordsHelp') }}
              </div>
            </Transition>
          </div>
          <input id="carousel-keyword-input" v-model="keywordInput" type="text" class="ds-input"
            :placeholder="t('carousel.phKeywords')" />
        </section>

        <!-- Verse layout / typography -->
        <section class="ds-card p-5 md:p-6">
          <p class="ds-eyebrow">
            {{ t('carousel.sectionTypography') }}
          </p>

          <label class="field-label">{{ t('carousel.fieldLinesPerSlide') }}</label>
          <div class="mb-4 flex items-center gap-3">
            <input v-model.number="linesPerSlide" type="range" min="4" max="16" step="1"
              class="h-2 flex-1 cursor-pointer accent-brand" />
            <span class="w-10 text-right text-sm tabular-nums text-content-secondary">{{ linesPerSlide }}</span>
          </div>

          <label class="field-label">{{ t('carousel.fieldBodyFontSize') }}</label>
          <div class="mb-4 flex items-center gap-3">
            <input v-model.number="bodyFontSizeScale" type="range" min="0.7" max="2" step="0.05"
              class="h-2 flex-1 cursor-pointer accent-brand" />
            <span class="w-12 text-right text-sm tabular-nums text-content-secondary">{{ Math.round(bodyFontSizeScale
              * 100)
            }}%</span>
          </div>

          <label class="field-label">{{ t('carousel.fieldLineHeight') }}</label>
          <div class="mb-4 flex items-center gap-3">
            <input v-model.number="bodyLineHeight" type="range" min="1.15" max="2.25" step="0.05"
              class="h-2 flex-1 cursor-pointer accent-brand" />
            <span class="w-12 text-right text-sm tabular-nums text-content-secondary">{{ bodyLineHeight.toFixed(2)
            }}</span>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
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
        <section class="ds-card p-5 md:p-6">
          <div class="flex items-baseline justify-between gap-2">
            <p class="ds-eyebrow mb-0">
              {{ t('carousel.sectionCaption') }}
            </p>
            <button type="button"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition hover:text-brand-hover hover:underline"
              @click="copyCaption">
              <Icon icon="heroicons:clipboard-document" class="h-4 w-4 shrink-0" aria-hidden="true" />
              {{ t('carousel.copyCaption') }}
            </button>
          </div>
          <pre
            class="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-ds-md bg-surface-subtle p-4 font-sans text-xs leading-relaxed text-content-secondary">{{
              captionText }}</pre>
          <p class="mt-3 text-xs leading-relaxed text-content-muted">
            {{ t('carousel.exportHint', { size: carouselExportSizeLabel }) }}
          </p>
        </section>
      </div>

      <!-- Column 3: Preview -->
      <div
        class="order-1 w-full rounded-ds-lg border border-edge-subtle bg-surface-subtle p-4 md:p-5 lg:order-none lg:sticky lg:top-24 lg:self-start">
        <div class="flex flex-col gap-4">
          <div class="flex min-w-0 items-start gap-2 sm:gap-3">
            <aside
              class="carousel-preview-toolbar flex shrink-0 flex-col items-center gap-1 overflow-visible rounded-ds-md border border-edge-subtle bg-surface-raised p-1 shadow-ds-card"
              :aria-label="t('carousel.previewToolbar')">
              <CarouselToolbarItem v-for="ratio in CAROUSEL_ASPECT_RATIOS" :key="ratio.id"
                :label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                :hint="t(`carousel.aspectRatio.${ratio.i18nKey}.hint`, { size: `${ratio.width}×${ratio.height}` })"
                placement="right">
                <button type="button"
                  class="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-ds-md border px-1.5 text-[10px] font-medium leading-none tabular-nums transition"
                  :class="aspectRatioId === ratio.id
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-transparent text-content-muted hover:border-edge-subtle hover:bg-surface-subtle hover:text-content'"
                  :aria-pressed="aspectRatioId === ratio.id"
                  :aria-label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                  @click="aspectRatioId = ratio.id">
                  {{ ratio.id }}
                </button>
              </CarouselToolbarItem>
            </aside>

            <div class="flex min-w-0 flex-1 justify-center">
              <div ref="previewFrameRef"
                class="carousel-preview-inner relative mx-auto overflow-hidden rounded-xl border border-edge-subtle bg-black shadow-lg"
                :style="previewInnerStyle" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                <div v-if="currentSlideProps" class="absolute left-1/2 top-1/2" :style="{
                  width: `${carouselWidth}px`,
                  height: `${carouselHeight}px`,
                  transform: `translate(-50%, -50%) scale(${previewScale})`,
                }">
                  <Transition name="carousel-preview" mode="out-in">
                    <div
                      :key="`${aspectRatioId}-${currentIndex}-${theme}-${title}-${poemText.length}-${bodyFontWeight}-${titleFontWeight}`"
                      class="h-full w-full">
                      <CarouselSlide v-bind="currentSlideProps" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <aside
              class="carousel-preview-toolbar flex shrink-0 flex-col items-center gap-1 overflow-visible rounded-ds-md border border-edge-subtle bg-surface-raised p-1 shadow-ds-card"
              :aria-label="t('carousel.previewExportToolbar')">
              <CarouselToolbarItem :label="t('carousel.enterFullScreen')" :hint="t('carousel.toolbarFullScreenHint')"
                placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md"
                  :aria-label="t('carousel.enterFullScreen')" @click="openPreviewModal">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 8V4m0 0h4M4 16v4m0 0h4m8-16h4m0 0v4m0 4v4m0 4h-4m-8 0H4" />
                  </svg>
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="t('carousel.downloadCurrent')"
                :hint="t('carousel.toolbarExportPngHint', { size: carouselExportSizeLabel })" placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md" :disabled="exporting"
                  :aria-label="t('carousel.downloadCurrent')" @click="exportCurrentPng">
                  <Icon icon="heroicons:photo" class="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="exporting ? t('carousel.exporting') : t('carousel.downloadZip')"
                :hint="t('carousel.toolbarExportZipHint')" placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md" :disabled="exporting"
                  :aria-label="exporting ? t('carousel.exporting') : t('carousel.downloadZipShort')" @click="exportZip">
                  <Icon icon="heroicons:arrow-down-tray" class="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
            </aside>
          </div>

          <div class="flex flex-col items-center gap-3">
            <div class="flex items-center justify-center gap-3">
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex <= 0" :aria-label="t('carousel.prev')" @click="currentIndex--">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div class="flex gap-1.5">
                <button v-for="(_, i) in slideModels" :key="i" type="button" class="h-2 w-2 rounded-full transition"
                  :class="i === currentIndex ? 'bg-brand w-5' : 'bg-content-muted/40 hover:bg-content-muted/70'"
                  :aria-label="t('carousel.goSlide', { n: i + 1 })" @click="currentIndex = i" />
              </div>
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex >= maxIndex" :aria-label="t('carousel.next')" @click="currentIndex++">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p class="text-center text-sm text-content-muted tabular-nums">
                {{ currentIndex + 1 }} / {{ slideModels.length }}
              </p>
            </div>

            <p class="text-center text-xs text-content-muted">
              {{ t('carousel.splitInfo', { n: bodySlideCount }) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enlarged preview modal -->
    <Teleport to="body">
      <div v-if="isPreviewModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-[2.5vh]">
        <button type="button" class="absolute inset-0 bg-content/40 backdrop-blur-sm"
          :aria-label="t('carousel.exitFullScreen')" @click="closePreviewModal" />

        <div ref="previewModalRef" role="dialog" aria-modal="true" :aria-label="t('carousel.preview')" tabindex="-1"
          class="relative z-10 flex h-[95vh] max-h-[95vh] w-full max-w-4xl min-h-0 flex-col gap-4 rounded-ds-xl border border-edge-subtle bg-surface-raised p-4 shadow-ds-popover outline-none sm:gap-5 sm:p-6"
          @keydown="onPreviewModalKeydown" @click.stop>
          <div class="flex shrink-0 items-center justify-between gap-3">
            <h2 class="font-serif text-lg font-semibold tracking-tight text-content">
              {{ t('carousel.preview') }}
            </h2>
            <CloseButton :label="t('carousel.exitFullScreen')" @click="closePreviewModal" />
          </div>

          <div class="flex min-h-0 flex-1 items-start gap-2 sm:gap-3">
            <aside
              class="carousel-preview-toolbar flex shrink-0 flex-col items-center gap-1 overflow-visible rounded-ds-md border border-edge-subtle bg-surface-raised p-1 shadow-ds-card"
              :aria-label="t('carousel.previewToolbar')">
              <CarouselToolbarItem v-for="ratio in CAROUSEL_ASPECT_RATIOS" :key="`modal-ratio-${ratio.id}`"
                :label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                :hint="t(`carousel.aspectRatio.${ratio.i18nKey}.hint`, { size: `${ratio.width}×${ratio.height}` })"
                placement="right">
                <button type="button"
                  class="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-ds-md border px-1.5 text-[10px] font-medium leading-none tabular-nums transition"
                  :class="aspectRatioId === ratio.id
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-transparent text-content-muted hover:border-edge-subtle hover:bg-surface-subtle hover:text-content'"
                  :aria-pressed="aspectRatioId === ratio.id"
                  :aria-label="t(`carousel.aspectRatio.${ratio.i18nKey}.label`)"
                  @click="aspectRatioId = ratio.id">
                  {{ ratio.id }}
                </button>
              </CarouselToolbarItem>
            </aside>

            <div class="flex min-h-0 min-w-0 flex-1 self-stretch items-center justify-center">
              <div ref="previewModalFrameRef"
                class="carousel-preview-inner relative mx-auto h-full max-h-full w-full max-w-full overflow-hidden rounded-xl border border-edge-subtle bg-black shadow-lg"
                :style="previewModalInnerStyle" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                <div v-if="currentSlideProps" class="absolute left-1/2 top-1/2" :style="{
                  width: `${carouselWidth}px`,
                  height: `${carouselHeight}px`,
                  transform: `translate(-50%, -50%) scale(${previewModalScale})`,
                }">
                  <Transition name="carousel-preview" mode="out-in">
                    <div
                      :key="`modal-${aspectRatioId}-${currentIndex}-${theme}-${title}-${poemText.length}-${bodyFontWeight}-${titleFontWeight}`"
                      class="h-full w-full">
                      <CarouselSlide v-bind="currentSlideProps" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <aside
              class="carousel-preview-toolbar flex shrink-0 flex-col items-center gap-1 overflow-visible rounded-ds-md border border-edge-subtle bg-surface-raised p-1 shadow-ds-card"
              :aria-label="t('carousel.previewExportToolbar')">
              <CarouselToolbarItem :label="t('carousel.exitFullScreen')" :hint="t('carousel.toolbarFullScreenExitHint')"
                placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md"
                  :aria-label="t('carousel.exitFullScreen')" @click="closePreviewModal">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="t('carousel.downloadCurrent')"
                :hint="t('carousel.toolbarExportPngHint', { size: carouselExportSizeLabel })" placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md" :disabled="exporting"
                  :aria-label="t('carousel.downloadCurrent')" @click="exportCurrentPng">
                  <Icon icon="heroicons:photo" class="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
              <CarouselToolbarItem :label="exporting ? t('carousel.exporting') : t('carousel.downloadZip')"
                :hint="t('carousel.toolbarExportZipHint')" placement="left">
                <button type="button" class="ds-icon-btn shrink-0 cursor-pointer rounded-ds-md" :disabled="exporting"
                  :aria-label="exporting ? t('carousel.exporting') : t('carousel.downloadZipShort')" @click="exportZip">
                  <Icon icon="heroicons:arrow-down-tray" class="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </CarouselToolbarItem>
            </aside>
          </div>

          <div class="flex shrink-0 flex-col items-center gap-3">
            <div class="flex flex-wrap items-center justify-center gap-3">
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex <= 0" :aria-label="t('carousel.prev')" @click="currentIndex--">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div class="flex gap-1.5">
                <button v-for="(_, i) in slideModels" :key="`modal-dot-${i}`" type="button"
                  class="h-2 w-2 rounded-full transition"
                  :class="i === currentIndex ? 'bg-brand w-5' : 'bg-content-muted/40 hover:bg-content-muted/70'"
                  :aria-label="t('carousel.goSlide', { n: i + 1 })" @click="currentIndex = i" />
              </div>
              <button type="button" class="ds-icon-btn disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex >= maxIndex" :aria-label="t('carousel.next')" @click="currentIndex++">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p class="text-center text-sm text-content-muted tabular-nums">
                {{ currentIndex + 1 }} / {{ slideModels.length }}
              </p>
            </div>

            <p class="text-center text-xs text-content-muted">
              {{ t('carousel.splitInfo', { n: bodySlideCount }) }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile export bar (desktop actions live in the tools bar) -->
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-edge-subtle bg-surface-raised/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-ds-popover backdrop-blur-md md:hidden">
      <div class="mx-auto flex w-full max-w-md items-center gap-2">
        <button type="button" class="ds-btn-secondary flex-1 gap-2 px-3 py-2.5 text-sm" :disabled="exporting"
          @click="exportCurrentPng">
          <Icon icon="heroicons:photo" class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ exporting ? t('carousel.exporting') : t('carousel.downloadCurrentShort') }}
        </button>
        <button type="button" class="ds-btn-primary flex-1 gap-2 px-3 py-2.5 text-sm" :disabled="exporting"
          @click="exportZip">
          <Icon icon="heroicons:arrow-down-tray" class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ exporting ? t('carousel.exporting') : t('carousel.downloadZipShort') }}
        </button>
      </div>
    </div>

    <!-- Hidden export mount -->
    <Teleport to="body">
      <div v-if="exporting && slidePropsFor(exportIndex)"
        class="pointer-events-none fixed -left-[9999px] top-0 z-[100] overflow-hidden"
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
.carousel-preview-inner {
  box-sizing: border-box;
}

.carousel-preview-toolbar {
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
