<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'

const { t } = useI18n()

const { labelForTag } = useTagLabel()

const props = defineProps<{
  poem: Poem
  featured?: boolean
  /** `masonry` — used in multi-column CSS layouts (no grid span). */
  layout?: 'grid' | 'masonry'
  /**
   * When set (same order as on the page), quick-read prev/next moves within this list without extra requests.
   * If omitted, prev/next uses catalog neighbors from GET /api/poems/:slug (fetched when needed).
   */
  quickReadList?: Poem[] | null
  view?: 'grid' | 'list'
}>()

const author = computed(() => props.poem.author)
const authorAvatar = computed(() => authorAvatarUrl(author.value))

/** Canonical reader: author page with poem selected (/poems/:slug redirects there). */
const poemHref = computed(() => {
  const s = props.poem.author?.slug
  if (s) return { path: `/authors/${s}`, query: { poem: props.poem.slug } }
  return `/poems/${props.poem.slug}`
})

const { toggle, isFavorite } = useFavorites()
const liked = computed(() => isFavorite(props.poem.id))

const moodTag = computed(
  () => props.poem.poemTags?.find((pt) => pt.tag.category === 'mood')?.tag ?? null,
)

const displayTags = computed(() => {
  const tags = props.poem.poemTags?.map((pt) => pt.tag) ?? []
  return tags.slice(0, 2)
})

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

/** Site catalog is Romanian-only; show a flag only for unexpected non-`ro` languages. */
const showLangFlag = computed(
  () => props.poem.language && props.poem.language !== 'ro',
)
const langFlags: Record<string, string> = { ro: '🇷🇴', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸' }
const langFlag = computed(() => langFlags[props.poem.language] ?? props.poem.language?.toUpperCase())

// ─── Quick-read modal (opened from card icon)
const quickReadOpen = ref(false)
const modalPoem = ref<Poem | null>(null)
const quickReadNavLoading = ref(false)

const readerPoem = computed(() => modalPoem.value ?? props.poem)
const readerAuthor = computed(() => readerPoem.value.author ?? null)

const readerPoemHref = computed(() => {
  const p = readerPoem.value
  const s = p.author?.slug
  if (s) return { path: `/authors/${s}`, query: { poem: p.slug } }
  return `/poems/${p.slug}`
})

const quickReadIndex = computed(() => {
  const list = props.quickReadList
  const m = modalPoem.value
  if (!list?.length || !m) return -1
  return list.findIndex((p) => p.id === m.id)
})

const hasQuickReadPrev = computed(() => {
  if (props.quickReadList?.length) {
    const i = quickReadIndex.value
    return i > 0
  }
  return !!modalPoem.value?.navigation?.older
})

const hasQuickReadNext = computed(() => {
  if (props.quickReadList?.length) {
    const i = quickReadIndex.value
    return i >= 0 && i < props.quickReadList!.length - 1
  }
  return !!modalPoem.value?.navigation?.newer
})

const showQuickReadNav = computed(
  () =>
    hasQuickReadPrev.value
    || hasQuickReadNext.value
    || quickReadNavLoading.value,
)

async function openQuickRead() {
  modalPoem.value = props.poem
  quickReadOpen.value = true
  if (!props.quickReadList?.length && !props.poem.navigation) {
    try {
      modalPoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(props.poem.slug)}`)
    } catch {
      modalPoem.value = props.poem
    }
  }
}

function closeQuickRead() {
  quickReadOpen.value = false
  modalPoem.value = null
}

async function quickReadGoPrev() {
  if (props.quickReadList?.length && modalPoem.value) {
    const i = quickReadIndex.value
    if (i > 0) modalPoem.value = props.quickReadList[i - 1]!
    return
  }
  const n = modalPoem.value?.navigation?.older
  if (!n) return
  quickReadNavLoading.value = true
  try {
    modalPoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(n.slug)}`)
  } finally {
    quickReadNavLoading.value = false
  }
}

async function quickReadGoNext() {
  if (props.quickReadList?.length && modalPoem.value) {
    const i = quickReadIndex.value
    if (i >= 0 && i < props.quickReadList!.length - 1) modalPoem.value = props.quickReadList[i + 1]!
    return
  }
  const n = modalPoem.value?.navigation?.newer
  if (!n) return
  quickReadNavLoading.value = true
  try {
    modalPoem.value = await $fetch<Poem>(`/api/poems/${encodeURIComponent(n.slug)}`)
  } finally {
    quickReadNavLoading.value = false
  }
}

watchEffect((onCleanup) => {
  if (!import.meta.client || !quickReadOpen.value) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeQuickRead()
      return
    }
    if (quickReadNavLoading.value) return
    if (e.key === 'ArrowLeft' && hasQuickReadPrev.value) {
      e.preventDefault()
      void quickReadGoPrev()
      return
    }
    if (e.key === 'ArrowRight' && hasQuickReadNext.value) {
      e.preventDefault()
      void quickReadGoNext()
    }
  }
  document.addEventListener('keydown', onKey, true)
  onCleanup(() => document.removeEventListener('keydown', onKey, true))
})
</script>

<template>
  <div
    :class="[
      layout === 'masonry' ? 'poetry-card poetry-card--masonry' : 'poetry-card poetry-card--grid-fill',
      { 'poetry-card--featured': featured && view !== 'list' && layout !== 'masonry' },
    ]"
  >
    <!-- List view -->
    <article
      v-if="view === 'list'"
      class="poetry-card__list"
    >
      <div
        class="poetry-card__accent"
        :style="accentColor ? `background-color: ${accentColor}` : ''"
      />

      <div class="poetry-card__list-body">
        <div class="poetry-card__list-title-row">
          <NuxtLink
            :to="poemHref"
            class="poetry-card__list-title-link"
          >
            <h2 class="poetry-card__title poetry-card__title--list">
              {{ poem.title }}<span
                v-if="poem.writtenYear"
                class="poetry-card__year"
              >{{ poem.writtenYear }}</span>
            </h2>
          </NuxtLink>
          <span
            v-if="showLangFlag"
            class="poetry-card__lang"
          >{{ langFlag }}</span>
        </div>

        <NuxtLink
          v-if="author"
          :to="`/authors/${author.slug}`"
          class="poetry-card__author-list"
        >
          <img
            :src="authorAvatar"
            alt=""
            loading="lazy"
            class="poetry-card__author-avatar poetry-card__author-avatar--md"
          >
          <span>{{ author.name }}</span>
        </NuxtLink>

        <p class="poem-text poetry-card__preview">
          {{ previewLines }}
        </p>
        <NuxtLink
          :to="poemHref"
          class="poetry-card__read-more"
          @click.stop
        >
          {{ t('card.readMore') }}
          <svg
            class="poetry-card__read-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>

      <div class="poetry-card__list-actions">
        <div class="poetry-card__action-row">
          <button
            type="button"
            class="poetry-card__icon-btn"
            :aria-label="t('card.quickRead')"
            :title="t('card.quickRead')"
            @click.stop="openQuickRead"
          >
            <svg
              class="poetry-card__icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3m18 0v3a2 2 0 01-2 2h-3"
              />
            </svg>
          </button>
          <button
            type="button"
            class="poetry-card__icon-btn poetry-card__icon-btn--fav"
            :class="{ 'poetry-card__icon-btn--liked': liked }"
            :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
            @click.prevent="toggle(poem.id)"
          >
            <Icon
              :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
              class="poetry-card__icon poetry-card__icon--sm"
              aria-hidden="true"
            />
          </button>
          <PoemCarouselIcon
            :slug="poem.slug"
            size="sm"
          />
        </div>
      </div>
    </article>

    <!-- Grid view (default) -->
    <article
      v-else
      class="poetry-card__grid"
      :class="layout === 'masonry' ? 'poetry-card__grid--auto' : 'poetry-card__grid--fill'"
    >
      <div class="poetry-card__grid-inner">
        <NuxtLink
          v-if="author"
          :to="`/authors/${author.slug}`"
          class="poetry-card__author-grid"
        >
          <img
            :src="authorAvatar"
            alt=""
            loading="lazy"
            class="poetry-card__author-avatar poetry-card__author-avatar--sm"
          >
          <span class="poetry-card__author-name">{{ author.name }}</span>
        </NuxtLink>

        <div class="poetry-card__grid-title">
          <NuxtLink
            :to="poemHref"
            class="poetry-card__grid-title-link"
          >
            <h2
              class="poetry-card__title"
              :class="featured ? 'poetry-card__title--featured' : 'poetry-card__title--card'"
            >
              {{ poem.title }}<span
                v-if="poem.writtenYear"
                class="poetry-card__year"
              >{{ poem.writtenYear }}</span>
            </h2>
          </NuxtLink>
        </div>

        <div
          v-if="displayTags.length"
          class="poetry-card__tags"
        >
          <TagBadge
            v-for="tag in displayTags"
            :key="tag.id"
            :name="tag.name"
            :slug="tag.slug"
            :color="tag.color"
          />
        </div>

        <p class="poem-text poetry-card__preview poetry-card__preview--grid">
          {{ previewLines }}
        </p>

        <div class="poetry-card__footer">
          <div class="poetry-card__footer-row">
            <NuxtLink
              :to="poemHref"
              class="poetry-card__read-more poetry-card__read-more--grid"
              @click.stop
            >
              {{ t('card.readMore') }}
              <svg
                class="poetry-card__read-icon poetry-card__read-icon--md"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
            <div class="poetry-card__action-row">
              <button
                type="button"
                class="poetry-card__icon-btn"
                :aria-label="t('card.quickRead')"
                :title="t('card.quickRead')"
                @click.stop="openQuickRead"
              >
                <svg
                  class="poetry-card__icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3m18 0v3a2 2 0 01-2 2h-3"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="poetry-card__icon-btn poetry-card__icon-btn--fav"
                :class="{ 'poetry-card__icon-btn--liked': liked }"
                :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
                @click.prevent="toggle(poem.id)"
              >
                <Icon
                  :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
                  class="poetry-card__icon poetry-card__icon--sm"
                  aria-hidden="true"
                />
              </button>
              <PoemCarouselIcon
                :slug="poem.slug"
                size="sm"
                class="poetry-card__carousel"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>

  <Teleport to="body">
    <Transition name="quick-read-fade">
      <div
        v-if="quickReadOpen"
        class="quick-read"
        @click.self="closeQuickRead"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="t('card.quickRead')"
          class="quick-read__dialog"
          @click.stop
        >
          <header class="quick-read__header">
            <div class="quick-read__header-main">
              <div class="quick-read__title-row">
                <NuxtLink
                  :to="readerPoemHref"
                  class="quick-read__title-link"
                  @click="closeQuickRead"
                >
                  <h3 class="quick-read__title">
                    {{ readerPoem.title }}
                  </h3>
                </NuxtLink>
                <PoemCarouselIcon
                  :slug="readerPoem.slug"
                  size="sm"
                />
              </div>
              <p
                v-if="readerAuthor"
                class="quick-read__author"
              >{{ readerAuthor.name }}</p>
            </div>
            <div class="quick-read__close-row">
              <CloseButton
                :label="t('card.quickReadClose')"
                @click="closeQuickRead"
              />
            </div>
          </header>

          <div class="quick-read__body">
            <PoemReader
              :poem="readerPoem"
              variant="modal"
              :show-title="false"
              :show-author="false"
              :show-written-context="false"
              :show-ornament="false"
            />
          </div>
          <footer
            v-if="showQuickReadNav"
            class="quick-read__footer"
            :aria-busy="quickReadNavLoading"
          >
            <div class="quick-read__nav">
              <button
                type="button"
                class="quick-read__nav-btn"
                :disabled="!hasQuickReadPrev || quickReadNavLoading"
                :aria-label="t('card.quickReadPrevAria')"
                @click="quickReadGoPrev"
              >
                <svg
                  class="quick-read__nav-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="quick-read__nav-btn"
                :disabled="!hasQuickReadNext || quickReadNavLoading"
                :aria-label="t('card.quickReadNextAria')"
                @click="quickReadGoNext"
              >
                <svg
                  class="quick-read__nav-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
