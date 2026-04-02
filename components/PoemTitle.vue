<script setup lang="ts">
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
  }>(),
  { showCarousel: true },
)

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
  </div>
</template>
