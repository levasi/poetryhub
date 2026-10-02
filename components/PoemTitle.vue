<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useFavorites } from '~/composables/useFavorites'

const { t } = useI18n()
const { toggle, isFavorite } = useFavorites()

/**
 * Poem title + optional Instagram / carousel shortcut. Use `pdp` on poem detail, `banner` on home hero.
 * Set `instagramSize` to override the default icon scale.
 */
const props = withDefaults(
  defineProps<{
    title: string
    slug: string
    variant: 'pdp' | 'banner'
    /** Set false to hide the Instagram carousel link */
    showCarousel?: boolean
    /** Instagram / carousel shortcut icon size (default `sm` — same as PoetryCard). */
    instagramSize?: 'xs' | 'sm' | 'md' | 'lg'
    /** When set, shows favorite toggle (same behavior as PoetryCard). */
    poemId?: string
  }>(),
  { showCarousel: true, instagramSize: 'sm' },
)

const liked = computed(() => (props.poemId ? isFavorite(props.poemId) : false))

const heading = computed(() => (props.variant === 'pdp' ? 'h1' : 'h3'))

const showActions = computed(() => Boolean(props.poemId || props.showCarousel))

const copied = ref(false)

async function sharePoem() {
  if (!import.meta.client) return
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: props.title, url })
      return
    } catch {
      // cancelled — fall through
    }
  }
  await navigator.clipboard.writeText(url)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div
    class="poem-title"
    :class="[
      variant === 'pdp' ? 'poem-title--pdp' : 'poem-title--banner',
    ]"
  >
    <component
      :is="heading"
      class="poem-title__heading"
    >
      {{ title }}
    </component>
    <div
      v-if="showActions"
      class="poem-title__actions"
    >
      <button
        v-if="poemId"
        type="button"
        class="poem-title__action"
        :class="{ 'poem-title__action--liked': liked }"
        :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
        @click.prevent="poemId && toggle(poemId)"
      >
        <Icon
          :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
          class="poem-title__action-icon"
          aria-hidden="true"
        />
      </button>
      <button
        v-if="poemId"
        type="button"
        class="poem-title__action"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click.prevent="sharePoem"
      >
        <Icon
          icon="heroicons:share"
          class="poem-title__action-icon"
          aria-hidden="true"
        />
      </button>
      <PoemCarouselIcon
        v-if="showCarousel"
        :slug="slug"
        :size="instagramSize"
      />
    </div>
  </div>
</template>
