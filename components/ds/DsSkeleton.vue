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
    class="ds-skeleton-stack"
    aria-hidden="true"
  >
    <div class="ds-skeleton ds-skeleton-stack__line ds-skeleton-stack__line--eyebrow" />
    <div class="ds-skeleton ds-skeleton-stack__line ds-skeleton-stack__line--title" />
    <div
      v-for="n in Math.max(0, lines - 2)"
      :key="n"
      class="ds-skeleton ds-skeleton-stack__line ds-skeleton-stack__line--body"
      :class="{ 'ds-skeleton-stack__line--short': n === lines - 2 }"
    />
  </div>
</template>
