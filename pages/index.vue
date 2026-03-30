<script setup lang="ts">
import { fetchRandomPoem, type Poem } from '~/composables/usePoems'

const { t } = useI18n()

useSeoMeta({
  title: computed(() => t('seo.homeTitle')),
  description: computed(() => t('seo.homeDesc')),
})

// Daily poem (hero)
const { data: dailyPoem } = await useFetch<Poem>('/api/poems/daily')

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
const recent   = computed(() => recentRes.value?.data ?? [])

const dailyPreview = computed(() => {
  const p = dailyPoem.value
  if (!p) return ''
  const raw = p.excerpt?.trim() || p.content
  return raw.length > 320 ? `${raw.slice(0, 320).trim()}…` : raw
})

const dailyAuthor = computed(() => dailyPoem.value?.author)

const dailyAuthorAvatar = computed(() =>
  dailyPoem.value ? authorAvatarUrl(dailyAuthor.value) : '',
)

// Random poem navigation
const router = useRouter()
async function goRandom() {
  try {
    const poem = await fetchRandomPoem()
    router.push(`/poems/${poem.slug}`)
  } catch {
    // silently ignore if db is empty
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- ── Daily poem (hero) ──────────────────────────────────────────────── -->
    <section v-if="dailyPoem" class="mb-16 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-ink-50 to-amber-50/40 px-6 py-12 shadow-sm md:px-10 md:py-16">
      <div class="mx-auto max-w-3xl text-center">
        <div class="mb-6 flex items-center justify-center gap-2">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
          <span class="text-xs font-medium uppercase tracking-widest text-gold-800">{{ t('home.poemOfDay') }}</span>
        </div>
        <h1 class="font-serif text-3xl font-bold leading-tight tracking-tight text-ink-900 md:text-5xl">
          {{ dailyPoem.title }}
        </h1>
        <div class="mt-3 flex items-center justify-center gap-3 text-sm text-ink-600 md:text-base">
          <img
            :src="dailyAuthorAvatar"
            :alt="dailyAuthor?.name ?? ''"
            loading="lazy"
            class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-ink-200/80"
          />
          <span v-if="dailyAuthor">— {{ dailyAuthor.name }}</span>
        </div>
        <p class="poem-text mx-auto mt-8 max-w-xl text-left text-[1.05rem] md:text-center">
          {{ dailyPreview }}
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            :to="`/poems/${dailyPoem.slug}`"
            class="rounded-full bg-gold-600 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gold-700"
          >
            {{ t('home.readFull') }}
          </NuxtLink>
          <NuxtLink
            to="/poems"
            class="rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
          >
            {{ t('home.explorePoems') }}
          </NuxtLink>
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
            @click="goRandom"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ t('home.randomPoem') }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Empty library: no daily poem ─────────────────────────────────────── -->
    <section v-else class="mb-16 py-16 text-center md:py-20">
      <h1 class="font-serif text-4xl font-bold leading-tight text-ink-900 md:text-6xl">
        {{ t('home.heroLine1') }}<br />
        <span class="text-gold-700">{{ t('home.heroLine2') }}</span>
      </h1>
      <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
        {{ t('home.subtitle') }}
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink
          to="/poems"
          class="rounded-full bg-gold-600 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gold-700"
        >
          {{ t('home.explorePoems') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ── Browse by Mood ─────────────────────────────────────────────────── -->
    <section v-if="moodTags?.length" class="mb-16">
      <h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">{{ t('home.browseByMood') }}</h2>
      <div class="flex flex-wrap gap-2">
        <TagBadge
          v-for="tag in moodTags"
          :key="tag.id"
          :name="tag.name"
          :slug="tag.slug"
          :color="tag.color"
        />
      </div>
    </section>

    <!-- ── Featured Poems ─────────────────────────────────────────────────── -->
    <section v-if="featured.length" class="mb-16">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="font-serif text-2xl font-bold text-ink-900">{{ t('home.featured') }}</h2>
        <NuxtLink to="/poems?featured=true" class="text-sm text-ink-600 hover:text-ink-900">{{ t('home.seeAll') }}</NuxtLink>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <PoetryCard v-for="poem in featured" :key="poem.id" :poem="poem" :featured="true" />
      </div>
    </section>

    <!-- ── Browse by Theme ────────────────────────────────────────────────── -->
    <section v-if="themeTags?.length" class="mb-16">
      <h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">{{ t('home.themes') }}</h2>
      <div class="flex flex-wrap gap-2">
        <TagBadge
          v-for="tag in themeTags"
          :key="tag.id"
          :name="tag.name"
          :slug="tag.slug"
          :color="tag.color"
        />
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

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <section v-if="!featured.length && !recent.length" class="py-24 text-center">
      <p class="font-serif text-xl text-ink-600">{{ t('home.emptyLibrary') }}</p>
      <p class="mt-2 text-sm text-ink-500">
        {{ t('home.emptyHintBefore') }}<NuxtLink to="/admin" class="underline hover:text-ink-800">{{ t('home.emptyHintLink') }}</NuxtLink>{{ t('home.emptyHintAfter') }}
      </p>
    </section>
  </div>
</template>
