<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'

const { t } = useI18n()
const { labelForTag } = useTagLabel()

const props = defineProps<{
  poem: Poem
  featured?: boolean
  view?: 'grid' | 'list'
}>()

const author = computed(() => props.poem.author)
const authorAvatar = computed(() => authorAvatarUrl(author.value))

const { toggle, isFavorite } = useFavorites()
const liked = computed(() => isFavorite(props.poem.id))

const moodTag = computed(
  () => props.poem.poemTags?.find((pt) => pt.tag.category === 'mood')?.tag ?? null,
)

const moodLabel = computed(() => {
  const m = moodTag.value
  if (!m) return ''
  return labelForTag(m.slug, m.name)
})

// First 3 lines of poem content for a real poetry preview
const previewLines = computed(() => {
  const lines = props.poem.content.split('\n').filter((l) => l.trim())
  return lines.slice(0, 3).join('\n')
})

const accentColor = computed(() => moodTag.value?.color ?? null)

const readingTimeLabel = computed(() => {
  if (!props.poem.readingTime) return null
  const mins = Math.ceil(props.poem.readingTime / 60)
  return mins < 1 ? t('card.underMin') : t('card.min', { n: mins })
})

const isNonEnglish = computed(() => props.poem.language && props.poem.language !== 'en')
const langFlags: Record<string, string> = { ro: '🇷🇴', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸' }
const langFlag = computed(() => langFlags[props.poem.language] ?? props.poem.language?.toUpperCase())
</script>

<template>
  <!-- List view -->
  <article
    v-if="view === 'list'"
    class="group flex items-start gap-5 border-b border-ink-200/80 py-5 transition-colors last:border-0 hover:bg-white/50"
  >
    <!-- Accent line -->
    <div
      class="mt-1.5 h-12 w-0.5 shrink-0 rounded-full opacity-70"
      :style="accentColor ? `background-color: ${accentColor}` : ''"
      :class="{ 'bg-ink-300': !accentColor }"
    />

    <div class="min-w-0 flex-1">
      <div class="mb-1 flex items-baseline gap-2">
        <NuxtLink :to="`/poems/${poem.slug}`">
          <h2 class="font-serif text-lg font-bold text-ink-900 transition-colors group-hover:text-gold-800 leading-snug">
            {{ poem.title }}
          </h2>
        </NuxtLink>
        <span v-if="isNonEnglish" class="text-sm">{{ langFlag }}</span>
      </div>

      <NuxtLink
        v-if="author"
        :to="`/authors/${author.slug}`"
        class="mb-2 flex items-center gap-2 text-xs text-ink-500 transition-colors hover:text-ink-800"
      >
        <img
          :src="authorAvatar"
          alt=""
          loading="lazy"
          class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
        />
        <span>{{ author.name }}</span>
      </NuxtLink>

      <p class="font-serif text-sm italic leading-relaxed text-ink-600"
        style="white-space: pre-wrap">{{ previewLines }}</p>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-2">
      <button
        type="button"
        class="rounded-full p-1.5 transition-colors"
        :class="liked ? 'text-rose-600' : 'text-ink-400 hover:text-rose-600'"
        :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
        @click.prevent="toggle(poem.id)"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
      <span v-if="readingTimeLabel" class="text-xs text-ink-500">{{ readingTimeLabel }}</span>
    </div>
  </article>

  <!-- Grid view (default) -->
  <article
    v-else
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md"
    :class="{ 'col-span-2 row-span-2': featured }"
  >
    <!-- Mood color bar at top -->
    <div
      class="h-0.5 w-full opacity-80 transition-all duration-300 group-hover:opacity-100"
      :style="accentColor ? `background-color: ${accentColor}` : ''"
      :class="{ 'bg-ink-300': !accentColor }"
    />

    <div class="flex flex-1 flex-col p-5">
      <!-- Header: mood tag + language -->
      <div class="mb-3 flex items-center gap-2">
        <span
          v-if="moodTag"
          class="rounded-full px-2.5 py-0.5 text-xs font-medium"
          :style="accentColor ? `background-color: ${accentColor}22; color: ${accentColor}` : ''"
          :class="{ 'bg-amber-50 text-amber-900': !accentColor }"
        >
          {{ moodLabel }}
        </span>
        <span v-if="isNonEnglish" class="ml-auto text-sm" :title="poem.language">{{ langFlag }}</span>
        <span v-if="poem.source === 'ai-generated'" class="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">{{ t('card.aiBadge') }}</span>
      </div>

      <!-- Title -->
      <NuxtLink :to="`/poems/${poem.slug}`" class="mb-1 block">
        <h2
          class="font-serif font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-800"
          :class="featured ? 'text-2xl' : 'text-lg'"
        >
          {{ poem.title }}
        </h2>
      </NuxtLink>

      <!-- Author -->
      <NuxtLink
        v-if="author"
        :to="`/authors/${author.slug}`"
        class="mb-4 flex items-center gap-2 text-xs text-ink-500 transition-colors hover:text-ink-800"
      >
        <img
          :src="authorAvatar"
          alt=""
          loading="lazy"
          class="shrink-0 rounded-full object-cover ring-1 ring-ink-200"
          :class="featured ? 'h-9 w-9' : 'h-8 w-8'"
        />
        <span>{{ author.name }}</span>
      </NuxtLink>

      <!-- Poem preview lines — actual poetry text -->
      <p
        class="flex-1 font-serif text-sm italic leading-relaxed text-ink-600"
        style="white-space: pre-wrap"
      >{{ previewLines }}</p>

      <!-- Footer -->
      <div class="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
        <span v-if="readingTimeLabel" class="text-xs text-ink-500">{{ readingTimeLabel }}</span>
        <button
          class="ml-auto rounded-full p-1.5 transition-colors"
          :class="liked ? 'text-rose-600' : 'text-ink-400 hover:text-rose-600'"
          :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
          @click.prevent="toggle(poem.id)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>
