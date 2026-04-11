<script setup lang="ts">
import {
  type Poem,
  type RandomAuthor,
} from '~/composables/usePoems'

const { t } = useI18n()
const { poemBodyStyle } = useReaderPreferences()
const readerSettingsOpen = ref(false)

/** Hero banner poem: same reader font/size, looser line-height for the excerpt. */
const heroPoemBodyStyle = computed(() => {
  const s = poemBodyStyle.value
  const lh = s.lineHeight
  if (typeof lh === 'number') {
    return { ...s, lineHeight: lh }
  }
  return s
})

useSeoMeta({
  title: computed(() => t('seo.homeTitle')),
  description: computed(() => t('seo.homeDesc')),
})

/** One HTTP call for the whole homepage (fast client navigations, e.g. logo → home). */
interface HomeTagRow {
  id: string
  name: string
  slug: string
  category: string
  color: string | null
}

interface HomePayload {
  featured: Poem[]
  recent: Poem[]
  moodTags: HomeTagRow[]
  themeTags: HomeTagRow[]
  hero: { a: RandomAuthor; p: Poem } | null
}

/** Deterministic die face 1–6 from the bundled hero (same on SSR and client; no Math.random). */
function diceFaceFromHeroBundle(hero: { a: { id: string }; p: { id: string } } | null): number {
  if (!hero) return 5
  let h = 0
  const s = `${hero.a.id}:${hero.p.id}`
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 6) + 1
}

const { data: home, pending: homePending } = await useFetch<HomePayload>('/api/home')

/** Die face for the SVG; tied to `home.hero` only so it does not reset when the user re-rolls (local hero refs). */
const heroDiceFace = computed(() => diceFaceFromHeroBundle(home.value?.hero ?? null))

const featured = computed(() => home.value?.featured ?? [])
const recent = computed(() => home.value?.recent ?? [])
const moodTags = computed(() => home.value?.moodTags ?? [])
const themeTags = computed(() => home.value?.themeTags ?? [])

// ── Hero: random author + poem (from /api/home payload; dice re-roll still uses APIs) ──
const heroAuthor = ref<RandomAuthor | null>(null)
const heroPoem = ref<Poem | null>(null)

watch(
  [home, homePending],
  () => {
    if (homePending.value) return
    const h = home.value
    if (!h) {
      heroAuthor.value = null
      heroPoem.value = null
      return
    }
    if (h.hero) {
      heroAuthor.value = h.hero.a
      heroPoem.value = h.hero.p
    } else {
      heroAuthor.value = null
      heroPoem.value = null
    }
  },
  { immediate: true },
)

const rollingDice = ref(false)
const heroVisible = ref(true)
const loadingPoemFromBib = ref(false)

const poemBlockRef = ref<HTMLElement | null>(null)

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Full poem body for the hero (line breaks preserved). */
const heroPoemBody = computed(() => {
  const p = heroPoem.value
  if (!p) return ''
  return (p.content?.trim() || p.excerpt?.trim() || '')
})

const heroAuthorAvatar = computed(() =>
  heroAuthor.value ? authorAvatarUrl(heroAuthor.value) : '',
)

/** Dice roll: content fades out, fetch, content fades in. No animation delay. */
async function rollHeroDice() {
  rollingDice.value = true
  heroVisible.value = false            // fade out existing content
  try {
    const hero = await $fetch<{ a: RandomAuthor; p: Poem }>('/api/home/roll')
    heroAuthor.value = hero.a          // swap content while invisible
    heroPoem.value = hero.p
    await nextTick()                   // ensure DOM updated before fading in
    heroVisible.value = true           // fade in new content
  } catch {
    heroVisible.value = true           // restore on error
    heroAuthor.value = null
    heroPoem.value = null
  } finally {
    rollingDice.value = false
  }
}

const heroAuthorYearsLabel = computed(() => {
  const a = heroAuthor.value
  if (!a) return null
  if (a.birthYear != null && a.deathYear != null) return t('authors.lifeSpan', { birth: a.birthYear, death: a.deathYear })
  if (a.birthYear != null) return t('authors.born', { year: a.birthYear })
  return null
})

const heroWrittenContext = computed(() => {
  const p = heroPoem.value
  if (!p) return null
  const y = p.writtenYear
  const period = p.writtenPeriod?.trim()
  if (y != null && period) return t('viewer.writtenYearAndPeriod', { year: y, period })
  if (y != null) return t('viewer.writtenInYear', { year: y })
  if (period) return period
  return null
})

/** Load a poem from bibliography into the hero. */
async function showPoemInHero(slug: string) {
  if (heroPoem.value?.slug === slug) return
  loadingPoemFromBib.value = true
  try {
    heroPoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(slug)}`)
    await nextTick()
    poemBlockRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch {
    /* keep previous poem */
  } finally {
    loadingPoemFromBib.value = false
  }
}

</script>

<template>
  <div class="animate-fade-in">
    <!-- Reading appearance (matches poem page fixed cog) -->
    <button type="button"
      class="fixed right-3 top-1/2 z-[45] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-edge-subtle bg-surface-raised/95 text-content-muted shadow-ds-card backdrop-blur-sm transition hover:border-brand-soft hover:text-brand-hover md:right-6"
      :aria-label="t('viewer.openReadingSettings')" @click="readerSettingsOpen = true">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    <ReaderSettingsSidebar v-model:open="readerSettingsOpen" id-prefix="home" />
    <!-- ── Hero: random author + poem; 3D dice in header ── -->
    <section class="overflow-x-clip rounded-none">
      <div v-if="homePending" class="flex min-h-[12rem] items-center justify-center">
        <span class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand" aria-hidden="true" />
      </div>

      <div v-else-if="!heroAuthor && !heroPoem" class="py-12 text-center text-content-muted">
        <p class="font-serif text-lg text-content-secondary">{{ t('home.emptyLibrary') }}</p>
      </div>

      <div v-else class="mx-auto">
        <div class="flex flex-col items-center gap-3 px-5 pb-6 pt-8 text-center md:px-8">
          <h2 class="font-serif text-display-sm font-semibold tracking-tight text-content">
            {{ t('home.heroBannerTitle') }}
          </h2>
          <p class="max-w-xl text-sm leading-relaxed text-content-secondary">
            {{ t('home.heroDiceHint') }}
          </p>
          <button type="button"
            class="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-visible disabled:opacity-50 md:h-16 md:w-16"
            :disabled="rollingDice" :aria-label="t('home.rollDice')" @click="rollHeroDice">
            <DiceSvg :rolling="rollingDice" :initial-face="heroDiceFace" />
          </button>
          <p v-if="heroPoem && heroWrittenContext"
            class="max-w-2xl text-center text-sm tabular-nums leading-relaxed text-content-muted">
            {{ heroWrittenContext }}
          </p>
        </div>

        <!-- Poet (left) | poem (right) -->
        <div v-if="heroAuthor"
          class="grid gap-8 px-5 pb-8 pt-8 transition-opacity duration-500 ease-in-out md:grid-cols-2 md:gap-10 md:px-8 lg:gap-12"
          :class="heroVisible ? 'opacity-100' : 'opacity-0'">
          <div class="min-w-0 md:pr-8">
            <div class="flex flex-col items-center text-center md:items-start md:text-left">
              <NuxtLink :to="`/authors/${heroAuthor.slug}`"
                class="group flex flex-col items-center md:items-start">
                <img :src="heroAuthorAvatar" :alt="heroAuthor.name" loading="lazy"
                  class="h-24 w-24 rounded-full object-cover ring-2 ring-edge-subtle transition group-hover:ring-brand-soft/70" />
              </NuxtLink>
              <NuxtLink :to="`/authors/${heroAuthor.slug}`"
                class="mt-4 font-serif text-2xl font-semibold tracking-tight text-content transition hover:text-gold-800">
                {{ heroAuthor.name }}
              </NuxtLink>
              <p v-if="heroAuthorYearsLabel" class="mt-1.5 text-sm tabular-nums text-content-muted">
                {{ heroAuthorYearsLabel }}
              </p>
              <p v-if="heroAuthor._count" class="mt-1 text-sm text-content-soft">
                {{ t('home.heroPoemCount', { n: heroAuthor._count.poems }) }}
              </p>
            </div>

            <section v-if="heroAuthor.bio?.trim()" class="mt-6 text-left">
              <h3 class="mb-2 font-serif text-sm font-semibold uppercase tracking-wide text-content-secondary">
                {{ t('authors.biography') }}
              </h3>
              <p class="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-content-secondary">
                {{ heroAuthor.bio }}
              </p>
            </section>

            <section v-if="heroAuthor.works?.length" class="mt-6 text-left">
              <h3 class="mb-1 font-serif text-sm font-semibold uppercase tracking-wide text-content-secondary">
                {{ t('authors.bibliography') }}
              </h3>
              <p class="mb-2 text-xs text-content-soft">{{ t('authors.worksInCollection') }}</p>
              <ul class="max-w-full list-inside list-disc space-y-1.5 text-sm text-content-secondary">
                <li v-for="w in heroAuthor.works" :key="w.slug" class="break-inside-avoid break-words">
                  <span class="inline-flex flex-wrap items-baseline gap-1.5">
                    <button type="button"
                      class="text-left text-gold-800 underline-offset-2 transition hover:text-gold-900 hover:underline disabled:cursor-wait disabled:opacity-60"
                      :class="heroPoem?.slug === w.slug ? 'font-semibold text-gold-900' : ''"
                      :disabled="loadingPoemFromBib" :aria-current="heroPoem?.slug === w.slug ? 'true' : undefined"
                      @click="showPoemInHero(w.slug)">
                      {{ w.title }}
                    </button>
                    <PoemCarouselIcon :slug="w.slug" size="sm" />
                  </span>
                </li>
              </ul>
            </section>
          </div>

          <div v-if="heroPoem" ref="poemBlockRef"
            class="min-w-0 border-t border-edge-subtle pt-8 md:border-t-0 md:pt-0">
            <PoemTitle :title="heroPoem.title" :slug="heroPoem.slug" variant="banner" :poem-id="heroPoem.id" />
            <NuxtLink v-if="heroPoem.author" :to="`/authors/${heroPoem.author.slug}`"
              class="mt-2 inline-block text-sm text-content-muted transition hover:text-gold-800">
              — {{ heroPoem.author.name }}
            </NuxtLink>
            <p class="mt-6 text-left md:mt-8" :style="heroPoemBodyStyle">
              {{ heroPoemBody }}
            </p>
          </div>
        </div>
      </div>

      <div class="mx-auto mt-10 flex max-w-content flex-wrap justify-center gap-3 pb-6">
        <NuxtLink to="/poems" class="ds-btn-secondary rounded-full px-8 py-3 text-sm font-medium">
          {{ t('home.explorePoems') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ── Recent Poems ───────────────────────────────────────────────────── -->
    <section v-if="recent.length" class="mb-24">
      <div class="mb-10 flex items-end justify-between gap-4">
        <h2 class="ds-section-heading mb-0">{{ t('home.recentPoems') }}</h2>
        <NuxtLink to="/poems"
          class="shrink-0 pb-3 text-sm font-medium text-content-muted transition hover:text-gold-800">
          {{ t('home.allPoemsLink') }}
        </NuxtLink>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <PoetryCard v-for="poem in recent" :key="poem.id" :poem="poem" />
      </div>
    </section>

    <!-- ── Admin hint when library lists are empty ─────────────────────────── -->
    <section v-if="!featured.length && !recent.length && !homePending && !heroAuthor && !heroPoem"
      class="py-8 text-center text-sm text-content-soft">
      <p>
        {{ t('home.emptyHintBefore') }}
        <NuxtLink to="/admin"
          class="font-medium underline decoration-edge-strong underline-offset-2 hover:text-content">
          {{ t('home.emptyHintLink') }}
        </NuxtLink>
        {{ t('home.emptyHintAfter') }}
      </p>
    </section>
  </div>
</template>
