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
    class="group flex items-start gap-5 border-b border-edge-subtle py-6 transition-colors last:border-0 hover:bg-surface-subtle/50"
  >
    <!-- Accent line -->
    <div
      class="mt-1.5 h-14 w-0.5 shrink-0 rounded-full opacity-80 transition-opacity group-hover:opacity-100"
      :style="accentColor ? `background-color: ${accentColor}` : ''"
      :class="{ 'bg-edge-strong': !accentColor }"
    />

    <div class="min-w-0 flex-1">
      <div class="mb-1.5 flex items-baseline gap-2">
        <NuxtLink :to="`/poems/${poem.slug}`" class="min-w-0 flex-1">
          <h2
            class="font-serif text-lg font-semibold leading-snug tracking-tight text-content transition-colors group-hover:text-brand"
          >
            {{ poem.title }}<span v-if="poem.writtenYear" class="ml-1.5 font-sans text-xs font-normal tabular-nums text-content-muted">{{ poem.writtenYear }}</span>
          </h2>
        </NuxtLink>
        <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
        <span v-if="showLangFlag" class="shrink-0 text-sm text-content-soft">{{ langFlag }}</span>
      </div>

      <NuxtLink
        v-if="author"
        :to="`/authors/${author.slug}`"
        class="mb-2 flex items-center gap-2 text-xs font-medium text-content-muted transition-colors hover:text-content-secondary"
      >
        <img
          :src="authorAvatar"
          alt=""
          loading="lazy"
          class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-edge-subtle"
        />
        <span>{{ author.name }}</span>
      </NuxtLink>

      <p class="font-serif text-sm italic leading-relaxed text-content-secondary" style="white-space: pre-wrap">
        {{ previewLines }}
      </p>
      <NuxtLink
        :to="`/poems/${poem.slug}`"
        class="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
        @click.stop
      >
        {{ t('card.readMore') }}
        <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-2">
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          class="inline-flex max-w-[11rem] items-center gap-1.5 rounded-ds-md py-2 pl-2 pr-2.5 text-content-muted transition-colors hover:bg-surface-subtle hover:text-brand"
          @click.stop="openQuickRead"
        >
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-left text-[11px] font-medium leading-tight">{{ t('card.quickReadLabel') }}</span>
        </button>
        <button
          type="button"
          class="rounded-ds-md p-2 transition-colors hover:bg-rose-50"
          :class="liked ? 'text-rose-600' : 'text-content-hint hover:text-rose-600'"
          :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
          @click.prevent="toggle(poem.id)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <span v-if="readingTimeLabel" class="text-ui-xs tabular-nums text-content-soft">{{ readingTimeLabel }}</span>
    </div>
  </article>

  <!-- Grid view (default) -->
  <article
    v-else
    class="group relative flex h-full flex-col overflow-hidden rounded-ds-lg border border-edge-subtle bg-surface-raised shadow-ds-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-edge hover:shadow-ds-card-hover"
  >
    <!-- Mood accent -->
    <div
      class="h-1 w-full opacity-90 transition-opacity duration-300 group-hover:opacity-100"
      :style="accentColor ? `background-color: ${accentColor}` : ''"
      :class="{ 'bg-gradient-to-r from-edge-strong to-edge': !accentColor }"
    />

    <div class="flex flex-1 flex-col" :class="featured ? 'p-6' : 'p-5'">
      <!-- Header: mood tag + language -->
      <div class="mb-3 flex min-h-[1.5rem] items-center gap-2">
        <span
          v-if="moodTag"
          class="inline-flex max-w-[min(100%,12rem)] items-center truncate rounded-full border border-black/5 px-2.5 py-0.5 text-xs font-medium"
          :style="accentColor ? `background-color: ${accentColor}18; color: ${accentColor}; border-color: ${accentColor}33` : ''"
          :class="{ 'border-amber-200/80 bg-amber-50/90 text-amber-950': !accentColor }"
        >
          {{ moodLabel }}
        </span>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <span v-if="showLangFlag" class="text-sm text-content-soft" :title="poem.language">{{ langFlag }}</span>
        </div>
      </div>

      <!-- Title -->
      <div class="mb-2 flex items-start gap-2">
        <NuxtLink :to="`/poems/${poem.slug}`" class="block min-w-0 flex-1">
          <h2
            class="font-serif font-semibold leading-snug tracking-tight text-content transition-colors group-hover:text-brand"
            :class="featured ? 'text-2xl md:text-[1.65rem]' : 'text-lg'"
          >
            {{ poem.title }}<span v-if="poem.writtenYear" class="ml-1.5 font-sans text-xs font-normal tabular-nums text-content-muted">{{ poem.writtenYear }}</span>
          </h2>
        </NuxtLink>
        <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
      </div>

      <!-- Author -->
      <NuxtLink
        v-if="author"
        :to="`/authors/${author.slug}`"
        class="mb-4 flex items-center gap-2.5 text-xs font-medium text-content-muted transition-colors hover:text-content-secondary"
      >
        <img
          :src="authorAvatar"
          alt=""
          loading="lazy"
          class="shrink-0 rounded-full object-cover ring-1 ring-edge-subtle"
          :class="featured ? 'h-9 w-9' : 'h-8 w-8'"
        />
        <span class="truncate">{{ author.name }}</span>
      </NuxtLink>

      <!-- Poem preview -->
      <p
        class="min-h-[4.5rem] flex-1 font-serif text-sm italic leading-relaxed text-content-secondary"
        style="white-space: pre-wrap"
      >
        {{ previewLines }}
      </p>

      <NuxtLink
        :to="`/poems/${poem.slug}`"
        class="group/readmore mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
        @click.stop
      >
        {{ t('card.readMore') }}
        <svg
          class="h-4 w-4 shrink-0 transition-transform group-hover/readmore:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>

      <!-- Footer -->
      <div class="mt-5 flex items-center justify-between gap-3 border-t border-edge-subtle pt-4">
        <span v-if="readingTimeLabel" class="text-ui-xs tabular-nums text-content-soft">{{ readingTimeLabel }}</span>
        <div class="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-ds-md py-2 pl-2 pr-2.5 text-content-muted transition-colors hover:bg-surface-subtle hover:text-brand"
            @click.stop="openQuickRead"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-[11px] font-medium leading-tight">{{ t('card.quickReadLabel') }}</span>
          </button>
          <button
            type="button"
            class="rounded-ds-md p-2 transition-colors hover:bg-rose-50"
            :class="liked ? 'text-rose-600' : 'text-content-hint hover:text-rose-600'"
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
          class="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-ds-xl border border-edge-subtle bg-surface-raised shadow-ds-popover"
          @click.stop
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-edge-subtle bg-surface-raised px-5 py-4"
          >
            <div class="min-w-0 flex-1">
              <p class="mb-0 block text-ui-xs font-semibold uppercase tracking-widest text-content-soft">
                {{ t('card.quickRead') }}
              </p>
              <div class="mt-1 flex items-start gap-2">
                <h3 class="min-w-0 flex-1 font-serif text-xl font-semibold leading-snug tracking-tight text-content">
                  {{ poem.title }}
                </h3>
                <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
              </div>
              <p v-if="author" class="mt-1 truncate text-sm text-content-secondary">{{ author.name }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="rounded-ds-md p-2 text-content-muted transition-colors hover:bg-surface-subtle hover:text-content"
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
                class="rounded-ds-md p-2 text-content-muted transition-colors hover:bg-surface-subtle hover:text-content"
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

          <div class="min-h-0 flex-1 overflow-y-auto bg-surface-page/50 px-5 py-6">
            <p :style="poemBodyStyle">{{ poem.content }}</p>
          </div>
          <footer class="shrink-0 border-t border-edge-subtle bg-surface-raised px-5 py-4">
            <NuxtLink
              :to="`/poems/${poem.slug}`"
              class="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
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
