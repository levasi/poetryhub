<script setup lang="ts">
import type { CarouselTheme } from '~/composables/useCarouselGenerator'

withDefaults(
  defineProps<{
    /** Matches carousel theme for contrast. */
    theme?: CarouselTheme
  }>(),
  { theme: 'minimal' },
)
</script>

<template>
  <p
    class="carousel-slide-brand"
    :class="`carousel-slide-brand--${theme}`"
  >
    poetryhub.ro
  </p>
</template>
