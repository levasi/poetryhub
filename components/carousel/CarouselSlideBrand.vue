<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Matches carousel theme for contrast. */
    theme?: 'minimal' | 'dark' | 'gradient' | 'neon'
  }>(),
  { theme: 'minimal' },
)
</script>

<template>
  <p class="pointer-events-none absolute bottom-8 left-0 right-0 z-10 text-center text-[28px] tracking-[0.22em]"
    :class="{
      'text-ink-400': theme === 'minimal',
      'text-ink-500': theme === 'dark',
      'text-white/55': theme === 'gradient',
      'text-emerald-500/75': theme === 'neon',
    }">
    poetryhub.ro
  </p>
</template>
