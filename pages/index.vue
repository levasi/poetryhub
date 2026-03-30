<script setup lang="ts">
import {
  fetchRandomAuthor,
  fetchRandomPoem,
  type Poem,
  type RandomAuthor,
} from '~/composables/usePoems'

const { t } = useI18n()

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
const recent   = computed(() => recentRes.value?.data ?? [])

// ── Hero: random author + poem (dice columns) ─────────────────────────────
const heroAuthor = ref<RandomAuthor | null>(null)
const heroPoem   = ref<Poem | null>(null)
const rollingAuthor = ref(false)
const rollingPoem   = ref(false)
/** True after the first author-dice load (success or empty DB). */
const heroInitialized = ref(false)

const heroPoemPreview = computed(() => {
  const p = heroPoem.value
  if (!p) return ''
  const raw = p.excerpt?.trim() || p.content
  return raw.length > 280 ? `${raw.slice(0, 280).trim()}…` : raw
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
    heroPoem.value = await fetchRandomPoem()
  } catch {
    heroPoem.value = null
  } finally {
    rollingPoem.value = false
  }
}

onMounted(() => {
  void rollAuthorDice()
})
</script>

<template>
  <div class="animate-fade-in">
    <!-- ── Hero: authors | poems (dice) ───────────────────────────────────── -->
    <section class="mb-16 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-ink-50 to-amber-50/40 px-4 py-10 shadow-sm sm:px-6 md:py-14">
      <div
        v-if="!heroInitialized"
        class="flex min-h-[12rem] items-center justify-center"
      >
        <span
          class="h-9 w-9 animate-spin rounded-full border-2 border-ink-200 border-t-gold-600"
          aria-hidden="true"
        />
      </div>

      <div
        v-else-if="!heroAuthor && !heroPoem"
        class="py-12 text-center text-ink-600"
      >
        <p class="font-serif text-lg">{{ t('home.emptyLibrary') }}</p>
      </div>

      <div
        v-else
        class="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-10"
      >
        <!-- Authors column -->
        <div class="flex flex-col rounded-xl border border-ink-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <div class="mb-4 flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
            <h2 class="font-serif text-xl font-bold text-ink-900">{{ t('home.heroAuthors') }}</h2>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition hover:border-gold-400 hover:text-gold-800 disabled:opacity-50"
              :disabled="rollingAuthor"
              :aria-label="t('home.rollAuthorDice')"
              @click="rollAuthorDice"
            >
              <span class="text-lg" aria-hidden="true">🎲</span>
            </button>
          </div>
          <div v-if="heroAuthor" class="flex min-h-[10rem] flex-1 flex-col">
            <NuxtLink
              :to="`/authors/${heroAuthor.slug}`"
              class="group flex flex-1 flex-col items-center text-center"
            >
              <img
                :src="heroAuthorAvatar"
                :alt="heroAuthor.name"
                loading="lazy"
                class="h-24 w-24 rounded-full object-cover ring-2 ring-ink-200/80 transition group-hover:ring-gold-400/60"
              />
              <p class="mt-4 font-serif text-2xl font-bold text-ink-900 transition group-hover:text-gold-800">
                {{ heroAuthor.name }}
              </p>
              <p
                v-if="heroAuthor._count"
                class="mt-1 text-sm text-ink-500"
              >
                {{ t('home.heroPoemCount', { n: heroAuthor._count.poems }) }}
              </p>
            </NuxtLink>
          </div>
        </div>

        <!-- Poems column -->
        <div class="flex flex-col rounded-xl border border-ink-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <div class="mb-4 flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
            <h2 class="font-serif text-xl font-bold text-ink-900">{{ t('home.heroPoems') }}</h2>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition hover:border-gold-400 hover:text-gold-800 disabled:opacity-50"
              :disabled="rollingPoem"
              :aria-label="t('home.rollPoemDice')"
              @click="rollPoemDice"
            >
              <span class="text-lg" aria-hidden="true">🎲</span>
            </button>
          </div>
          <div v-if="heroPoem" class="flex min-h-[10rem] flex-1 flex-col">
            <h3 class="font-serif text-xl font-bold leading-snug text-ink-900 md:text-2xl">
              {{ heroPoem.title }}
            </h3>
            <NuxtLink
              v-if="heroPoem.author"
              :to="`/authors/${heroPoem.author.slug}`"
              class="mt-2 inline-flex items-center gap-2 text-sm text-ink-600 transition hover:text-gold-800"
            >
              <img
                :src="poemColumnAvatar"
                :alt="heroPoem.author?.name ?? ''"
                loading="lazy"
                class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
              />
              <span>— {{ heroPoem.author.name }}</span>
            </NuxtLink>
            <p class="poem-text mt-4 flex-1 text-left text-[1.05rem] leading-relaxed text-ink-700">
              {{ heroPoemPreview }}
            </p>
            <NuxtLink
              :to="`/poems/${heroPoem.slug}`"
              class="mt-6 inline-flex w-fit items-center rounded-full bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gold-700"
            >
              {{ t('home.readFull') }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-3">
        <NuxtLink
          to="/poems"
          class="rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
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

    <!-- ── Admin hint when library lists are empty ─────────────────────────── -->
    <section v-if="!featured.length && !recent.length && heroInitialized" class="py-8 text-center text-sm text-ink-500">
      <p>
        {{ t('home.emptyHintBefore') }}<NuxtLink to="/admin" class="underline hover:text-ink-800">{{ t('home.emptyHintLink') }}</NuxtLink>{{ t('home.emptyHintAfter') }}
      </p>
    </section>
  </div>
</template>
