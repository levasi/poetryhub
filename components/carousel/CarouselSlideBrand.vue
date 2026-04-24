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
    class="pointer-events-none absolute bottom-8 left-0 right-0 z-10 text-center text-[28px] tracking-[0.22em]"
    :class="{
      'text-ink-400': theme === 'minimal',
      'text-ink-500': theme === 'dark',
      'text-white/55': theme === 'gradient',
      'text-emerald-500/75': theme === 'neon',
      'text-amber-800/50': theme === 'parchment',
      'text-cyan-300/70': theme === 'ocean',
      'text-white/60': theme === 'sunset',
      'text-zinc-400': theme === 'editorial',
      'text-emerald-400/65': theme === 'forest',
      'text-violet-400/75': theme === 'cosmos',
    }"
  >
    poetryhub.ro
  </p>
</template>
