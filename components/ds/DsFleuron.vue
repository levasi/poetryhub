<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Total width of the ornament (hairlines + star). */
    width?: string
  }>(),
  { width: '7.5rem' },
)
</script>

<template>
  <div
    class="ds-fleuron"
    :style="{ width }"
    aria-hidden="true"
  >
    <span class="ds-fleuron__line" />
    <svg
      class="ds-fleuron__star"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1.5 9.1 6.9 14.5 8 9.1 9.1 8 14.5 6.9 9.1 1.5 8 6.9 6.9Z" />
    </svg>
    <span class="ds-fleuron__line" />
  </div>
</template>
