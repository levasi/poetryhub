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

const titleClass = computed(() =>
  props.variant === 'pdp'
    ? 'leading-tight tracking-tight text-4xl md:text-5xl'
    : 'leading-snug text-xl',
)

const wrapperClass = computed(() => (props.variant === 'pdp' ? 'mb-3' : ''))

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
    :class="[
      wrapperClass,
      variant === 'pdp'
        ? 'flex flex-col gap-2'
        : 'flex flex-wrap items-center gap-x-3 gap-y-2',
    ]"
  >
    <component
      :is="heading"
      class="font-serif font-semibold text-content"
      :class="[titleClass, variant === 'pdp' ? 'order-2' : 'order-1']"
    >
      {{ title }}
    </component>
    <div
      v-if="showActions"
      class="flex shrink-0 items-center gap-0.5"
      :class="variant === 'pdp' ? 'order-1' : 'order-2'"
    >
      <button
        v-if="poemId"
        type="button"
        class="rounded-ds-md p-2 transition-colors"
        :class="liked ? 'text-brand bg-brand-tint' : 'text-content-hint hover:bg-brand-tint hover:text-brand'"
        :aria-label="liked ? t('card.favoriteRemove') : t('card.favoriteAdd')"
        @click.prevent="poemId && toggle(poemId)"
      >
        <Icon
          :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
          class="h-4 w-4"
          aria-hidden="true"
        />
      </button>
      <button
        v-if="poemId"
        type="button"
        class="rounded-ds-md p-2 text-content-hint transition-colors hover:bg-brand-tint hover:text-brand"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click.prevent="sharePoem"
      >
        <Icon icon="heroicons:share" class="h-4 w-4" aria-hidden="true" />
      </button>
      <PoemCarouselIcon
        v-if="showCarousel"
        :slug="slug"
        :size="instagramSize"
        class="shrink-0"
      />
    </div>
  </div>
</template>
