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
  <div class="mx-auto flex items-center justify-center gap-3 text-brand/45" :style="{ width }" aria-hidden="true">
    <span class="h-px flex-1 bg-current" />
    <svg class="size-3 shrink-0 text-brand" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5 9.1 6.9 14.5 8 9.1 9.1 8 14.5 6.9 9.1 1.5 8 6.9 6.9Z" />
    </svg>
    <span class="h-px flex-1 bg-current" />
  </div>
</template>
