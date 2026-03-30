<script setup lang="ts">
import {
  fetchRandomAuthor,
  fetchRandomPoem,
  type Poem,
  type RandomAuthor,
} from '~/composables/usePoems'

const { t } = useI18n()
const { poemBodyStyle } = useReaderPreferences()
const readerSettingsOpen = ref(false)

useSeoMeta({
  title: computed(() => t('seo.homeTitle')),
  description: computed(() => t('seo.homeDesc')),
})

// Featured poems
const { data: featuredRes } = await useFetch<{ data: Poem[] }>('/api/poems', {
  params: { featured: 'true', limit: 3 },
})

// Recent poems
const { data: recentRes } = await useFetch<{ data: Poem[] }>('/api/poems', {
  params: { limit: 8 },
})

// Mood / theme tags for category browsing
const { data: moodTags } = await useFetch('/api/tags', { params: { category: 'mood' } })
const { data: themeTags } = await useFetch('/api/tags', { params: { category: 'theme' } })

const featured = computed(() => featuredRes.value?.data ?? [])
const recent = computed(() => recentRes.value?.data ?? [])

// ── Hero: random author + poem (dice columns) ─────────────────────────────
const heroAuthor = ref<RandomAuthor | null>(null)
const heroPoem = ref<Poem | null>(null)
const rollingAuthor = ref(false)
const rollingPoem = ref(false)
const loadingPoemFromBib = ref(false)
/** True after the first author-dice load (success or empty DB). */
const heroInitialized = ref(false)

const poemsColumnRef = ref<HTMLElement | null>(null)

/** Full poem body for the hero (line breaks preserved). */
const heroPoemBody = computed(() => {
  const p = heroPoem.value
  if (!p) return ''
  return (p.content?.trim() || p.excerpt?.trim() || '')
})

const heroAuthorAvatar = computed(() =>
  heroAuthor.value ? authorAvatarUrl(heroAuthor.value) : '',
)

const poemColumnAvatar = computed(() =>
  heroPoem.value?.author ? authorAvatarUrl(heroPoem.value.author) : '',
)

async function rollAuthorDice() {
  rollingAuthor.value = true
  try {
    const a = await fetchRandomAuthor()
    heroAuthor.value = a
    const p = await fetchRandomPoem(a.slug)
    heroPoem.value = p
  } catch {
    heroAuthor.value = null
    heroPoem.value = null
  } finally {
    rollingAuthor.value = false
    heroInitialized.value = true
  }
}

async function rollPoemDice() {
  rollingPoem.value = true
  try {
    // Match the author shown in the left column (same as after author roll)
    heroPoem.value = await fetchRandomPoem(heroAuthor.value?.slug)
  } catch {
    heroPoem.value = null
  } finally {
    rollingPoem.value = false
  }
}

/** Load a poem from bibliography into the hero (right column). */
async function showPoemInHero(slug: string) {
  if (heroPoem.value?.slug === slug) return
  loadingPoemFromBib.value = true
  try {
    heroPoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(slug)}`)
    await nextTick()
    poemsColumnRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch {
    /* keep previous poem */
  } finally {
    loadingPoemFromBib.value = false
  }
}

onMounted(() => {
  void rollAuthorDice()
})
</script>

<template>
  <div class="animate-fade-in">
    <!-- Reading appearance (matches poem page fixed cog) -->
    <button type="button"
      class="fixed right-3 top-1/2 z-[45] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200/90 bg-white/95 text-ink-600 shadow-md backdrop-blur-sm transition hover:border-gold-400/70 hover:text-gold-800 md:right-6"
      :aria-label="t('viewer.openReadingSettings')" @click="readerSettingsOpen = true">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    <ReaderSettingsSidebar v-model:open="readerSettingsOpen" id-prefix="home" />

    <!-- ── Hero: authors | poems (dice) — full-bleed width (breaks out of main padding) ── -->
    <section
      class="mb-16 w-screen max-w-[100vw] ml-[calc(50%-50vw)] overflow-x-clip rounded-none bg-gradient-to-br from-white via-ink-50 to-amber-50/40 px-4 shadow-sm sm:px-6">
      <div v-if="!heroInitialized" class="flex min-h-[12rem] items-center justify-center">
        <span class="h-9 w-9 animate-spin rounded-full border-2 border-ink-200 border-t-gold-600" aria-hidden="true" />
      </div>

      <div v-else-if="!heroAuthor && !heroPoem" class="py-12 text-center text-ink-600">
        <p class="font-serif text-lg">{{ t('home.emptyLibrary') }}</p>
      </div>

      <div v-else class="mx-auto grid gap-8 md:grid-cols-2 md:gap-10">
        <!-- Authors column -->
        <div
          class="flex flex-col rounded-xl border border-ink-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <div class="mb-4 flex flex-col items-center gap-3 border-b border-ink-100 pb-3">
            <h2 class="w-full text-center font-serif text-xl font-bold text-ink-900">{{ t('home.heroAuthors') }}</h2>
            <button type="button"
              class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-md transition hover:border-gold-400 hover:text-gold-800 disabled:opacity-50 md:h-16 md:w-16"
              :disabled="rollingAuthor" :aria-label="t('home.rollAuthorDice')" @click="rollAuthorDice">
              <span class="text-2xl leading-none md:text-3xl" aria-hidden="true">🎲</span>
            </button>
          </div>
          <div v-if="heroAuthor" class="flex min-h-[10rem] flex-1 flex-col">
            <NuxtLink :to="`/authors/${heroAuthor.slug}`" class="group flex flex-col items-center text-center">
              <img :src="heroAuthorAvatar" :alt="heroAuthor.name" loading="lazy"
                class="h-24 w-24 rounded-full object-cover ring-2 ring-ink-200/80 transition group-hover:ring-gold-400/60" />
              <p class="mt-4 font-serif text-2xl font-bold text-ink-900 transition group-hover:text-gold-800">
                {{ heroAuthor.name }}
              </p>
              <p v-if="heroAuthor._count" class="mt-1 text-sm text-ink-500">
                {{ t('home.heroPoemCount', { n: heroAuthor._count.poems }) }}
              </p>
            </NuxtLink>

            <section v-if="heroAuthor.bio?.trim()" class="mt-5 w-full border-t border-ink-100 pt-4 text-left">
              <h3 class="mb-2 font-serif text-sm font-bold uppercase tracking-wide text-ink-800">
                {{ t('authors.biography') }}
              </h3>
              <p class="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {{ heroAuthor.bio }}
              </p>
            </section>

            <section v-if="heroAuthor.works?.length" class="mt-4 w-full border-t border-ink-100 pt-4 text-left">
              <h3 class="mb-1 font-serif text-sm font-bold uppercase tracking-wide text-ink-800">
                {{ t('authors.bibliography') }}
              </h3>
              <p class="mb-2 text-xs text-ink-500">{{ t('authors.worksInCollection') }}</p>
              <ul class="max-w-full list-inside list-disc space-y-1.5 text-sm text-ink-700 sm:columns-2 sm:gap-x-8">
                <li v-for="w in heroAuthor.works" :key="w.slug" class="break-inside-avoid break-words">
                  <button type="button"
                    class="text-left text-gold-800 underline-offset-2 transition hover:text-gold-900 hover:underline disabled:cursor-wait disabled:opacity-60"
                    :class="heroPoem?.slug === w.slug ? 'font-semibold text-gold-900' : ''"
                    :disabled="loadingPoemFromBib" :aria-current="heroPoem?.slug === w.slug ? 'true' : undefined"
                    @click="showPoemInHero(w.slug)">
                    {{ w.title }}
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <!-- Poems column -->
        <div ref="poemsColumnRef"
          class="flex flex-col rounded-xl border border-ink-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <div class="mb-4 flex flex-col items-center gap-3 border-b border-ink-100 pb-3">
            <h2 class="w-full text-center font-serif text-xl font-bold text-ink-900">{{ t('home.heroPoems') }}</h2>
            <button type="button"
              class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-md transition hover:border-gold-400 hover:text-gold-800 disabled:opacity-50 md:h-16 md:w-16"
              :disabled="rollingPoem" :aria-label="t('home.rollPoemDice')" @click="rollPoemDice">
              <span class="text-2xl leading-none md:text-3xl" aria-hidden="true">🎲</span>
            </button>
          </div>
          <div v-if="heroPoem" class="flex min-h-[10rem] flex-1 flex-col">
            <h3 class="font-serif text-xl font-bold leading-snug text-ink-900 md:text-2xl">
              {{ heroPoem.title }}
            </h3>
            <NuxtLink v-if="heroPoem.author" :to="`/authors/${heroPoem.author.slug}`"
              class="mt-2 inline-flex items-center gap-2 text-sm text-ink-600 transition hover:text-gold-800">
              <img :src="poemColumnAvatar" :alt="heroPoem.author?.name ?? ''" loading="lazy"
                class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-ink-200" />
              <span>— {{ heroPoem.author.name }}</span>
            </NuxtLink>
            <p class="mt-8 flex-1 text-left" :style="poemBodyStyle">
              {{ heroPoemBody }}
            </p>
          </div>
        </div>
      </div>

      <div class="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-3">
        <NuxtLink to="/poems"
          class="rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50">
          {{ t('home.explorePoems') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ── Browse by Mood ─────────────────────────────────────────────────── -->
    <section v-if="moodTags?.length" class="mb-16">
      <h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">{{ t('home.browseByMood') }}</h2>
      <div class="flex flex-wrap gap-2">
        <TagBadge v-for="tag in moodTags" :key="tag.id" :name="tag.name" :slug="tag.slug" :color="tag.color" />
      </div>
    </section>

    <!-- ── Featured Poems ─────────────────────────────────────────────────── -->
    <section v-if="featured.length" class="mb-16">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="font-serif text-2xl font-bold text-ink-900">{{ t('home.featured') }}</h2>
        <NuxtLink to="/poems?featured=true" class="text-sm text-ink-600 hover:text-ink-900">{{ t('home.seeAll') }}
        </NuxtLink>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <PoetryCard v-for="poem in featured" :key="poem.id" :poem="poem" :featured="true" />
      </div>
    </section>

    <!-- ── Browse by Theme ────────────────────────────────────────────────── -->
    <section v-if="themeTags?.length" class="mb-16">
      <h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">{{ t('home.themes') }}</h2>
      <div class="flex flex-wrap gap-2">
        <TagBadge v-for="tag in themeTags" :key="tag.id" :name="tag.name" :slug="tag.slug" :color="tag.color" />
      </div>
    </section>

    <!-- ── Recent Poems ───────────────────────────────────────────────────── -->
    <section v-if="recent.length" class="mb-16">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="font-serif text-2xl font-bold text-ink-900">{{ t('home.recentPoems') }}</h2>
        <NuxtLink to="/poems" class="text-sm text-ink-600 hover:text-ink-900">{{ t('home.allPoemsLink') }}</NuxtLink>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PoetryCard v-for="poem in recent" :key="poem.id" :poem="poem" />
      </div>
    </section>

    <!-- ── Admin hint when library lists are empty ─────────────────────────── -->
    <section v-if="!featured.length && !recent.length && heroInitialized" class="py-8 text-center text-sm text-ink-500">
      <p>
        {{ t('home.emptyHintBefore') }}<NuxtLink to="/admin" class="underline hover:text-ink-800">{{
          t('home.emptyHintLink') }}</NuxtLink>{{ t('home.emptyHintAfter') }}
      </p>
    </section>
  </div>
</template>
