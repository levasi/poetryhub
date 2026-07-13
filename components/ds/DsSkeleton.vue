<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Number of text-shaped lines to render. */
    lines?: number
  }>(),
  { lines: 3 },
)
</script>

<template>
  <div
    class="space-y-3"
    aria-hidden="true"
  >
    <div class="ds-skeleton h-3 w-1/4" />
    <div class="ds-skeleton h-5 w-3/4" />
    <div
      v-for="n in Math.max(0, lines - 2)"
      :key="n"
      class="ds-skeleton h-4"
      :class="n === lines - 2 ? 'w-5/6' : 'w-full'"
    />
  </div>
</template>
