<script setup lang="ts">
import { useFavorites } from '~/composables/useFavorites'

const { t } = useI18n()
const { toggle, isFavorite } = useFavorites()

/**
 * Poem title + optional carousel shortcut. Use `pdp` on poem detail, `banner` on home hero.
 */
const props = withDefaults(
  defineProps<{
    title: string
    slug: string
    variant: 'pdp' | 'banner'
    /** Set false to hide the Instagram carousel link */
    showCarousel?: boolean
    /** When set, shows favorite toggle (same behavior as PoetryCard). */
    poemId?: string
  }>(),
  { showCarousel: true },
)

const liked = computed(() => (props.poemId ? isFavorite(props.poemId) : false))

const heading = computed(() => (props.variant === 'pdp' ? 'h1' : 'h3'))

const titleClass = computed(() =>
  props.variant === 'pdp'
    ? 'leading-tight tracking-tight text-4xl md:text-5xl lg:text-6xl'
    : 'leading-snug text-xl md:text-2xl',
)

const iconSize = computed(() => (props.variant === 'pdp' ? 'md' : 'sm'))

const iconClass = computed(() =>
  props.variant === 'pdp' ? 'mt-1 shrink-0 md:mt-2' : 'shrink-0',
)

const wrapperClass = computed(() => (props.variant === 'pdp' ? 'mb-3' : ''))
</script>

<template>
  <div class="flex flex-wrap items-start gap-x-3 gap-y-2" :class="wrapperClass">
    <component
      :is="heading"
      class="min-w-0 flex-1 font-serif font-bold text-content"
      :class="titleClass"
    >
      {{ title }}
    </component>
    <PoemCarouselIcon
      v-if="showCarousel"
      :slug="slug"
      :size="iconSize"
      :class="iconClass"
    />
    <button
      v-if="poemId"
      type="button"
      class="rounded-ds-md p-2 transition-colors hover:bg-rose-500/15"
      :class="liked ? 'text-rose-600' : 'text-content-hint hover:text-rose-600'"
      :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
      @click.prevent="poemId && toggle(poemId)"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  </div>
</template>
