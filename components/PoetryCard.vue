<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'

const { t } = useI18n()

const { poemBodyStyle } = useReaderPreferences()
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

/** Site catalog is Romanian-only; show a flag only for unexpected non-`ro` languages. */
const showLangFlag = computed(
  () => props.poem.language && props.poem.language !== 'ro',
)
const langFlags: Record<string, string> = { ro: '🇷🇴', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸' }
const langFlag = computed(() => langFlags[props.poem.language] ?? props.poem.language?.toUpperCase())

// ─── Quick-read modal (opened from card icon)
const quickReadOpen = ref(false)
const readerPrefsOpen = ref(false)

function openQuickRead() {
  quickReadOpen.value = true
}

function closeQuickRead() {
  quickReadOpen.value = false
}

watchEffect((onCleanup) => {
  if (!import.meta.client || !quickReadOpen.value) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    if (readerPrefsOpen.value) {
      readerPrefsOpen.value = false
      e.stopImmediatePropagation()
      return
    }
    closeQuickRead()
  }
  document.addEventListener('keydown', onKey, true)
  onCleanup(() => document.removeEventListener('keydown', onKey, true))
})
</script>

<template>
  <div
    class="h-full"
    :class="{ 'col-span-2 row-span-2': featured && view !== 'list' }"
  >
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
        <NuxtLink :to="`/poems/${poem.slug}`" class="min-w-0 flex-1">
          <h2 class="font-serif text-lg font-bold text-ink-900 transition-colors group-hover:text-gold-800 leading-snug">
            {{ poem.title }}
          </h2>
        </NuxtLink>
        <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
        <span v-if="showLangFlag" class="shrink-0 text-sm">{{ langFlag }}</span>
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
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="inline-flex max-w-[11rem] items-center gap-1 rounded-full py-1 pl-1.5 pr-2 text-ink-500 transition-colors hover:text-gold-700"
          @click.stop="openQuickRead"
        >
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-left text-[11px] font-medium leading-tight">{{ t('card.quickReadLabel') }}</span>
        </button>
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
      </div>
      <span v-if="readingTimeLabel" class="text-xs text-ink-500">{{ readingTimeLabel }}</span>
    </div>
  </article>

  <!-- Grid view (default) -->
  <article
    v-else
    class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md"
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
        <span v-if="showLangFlag" class="ml-auto text-sm" :title="poem.language">{{ langFlag }}</span>
        <span v-if="poem.source === 'ai-generated'" class="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">{{ t('card.aiBadge') }}</span>
      </div>

      <!-- Title -->
      <div class="mb-1 flex items-start gap-2">
        <NuxtLink :to="`/poems/${poem.slug}`" class="block min-w-0 flex-1">
          <h2
            class="font-serif font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-800"
            :class="featured ? 'text-2xl' : 'text-lg'"
          >
            {{ poem.title }}
          </h2>
        </NuxtLink>
        <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
      </div>

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
        <div class="ml-auto flex items-center gap-1">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-2 text-ink-500 transition-colors hover:text-gold-700"
            @click.stop="openQuickRead"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-[11px] font-medium leading-tight">{{ t('card.quickReadLabel') }}</span>
          </button>
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
        </div>
      </div>
    </div>
  </article>
  </div>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="quickReadOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
        @click.self="closeQuickRead"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="t('card.quickRead')"
          class="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl ring-1 ring-ink-200/60"
          @click.stop
        >
          <header class="flex shrink-0 items-start justify-between gap-3 border-b border-ink-200/80 bg-white px-5 py-4">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium uppercase tracking-wide text-ink-500">{{ t('card.quickRead') }}</p>
              <div class="mt-0.5 flex items-start gap-2">
                <h3 class="min-w-0 flex-1 font-serif text-xl font-bold leading-snug text-ink-900">{{ poem.title }}</h3>
                <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
              </div>
              <p v-if="author" class="mt-1 truncate text-sm text-ink-600">{{ author.name }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                :aria-label="t('viewer.openReadingSettings')"
                @click="readerPrefsOpen = true"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                :aria-label="t('card.quickReadClose')"
                @click="closeQuickRead"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <ReaderSettingsSidebar v-model:open="readerPrefsOpen" :id-prefix="`qr-${poem.id}`" />

          <div class="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-6">
            <p :style="poemBodyStyle">{{ poem.content }}</p>
          </div>
          <footer class="shrink-0 border-t border-ink-200/80 bg-white px-5 py-4">
            <NuxtLink
              :to="`/poems/${poem.slug}`"
              class="inline-flex items-center gap-2 text-sm font-medium text-gold-800 transition-colors hover:text-gold-950"
              @click="closeQuickRead"
            >
              {{ t('card.readFullPoem') }}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
