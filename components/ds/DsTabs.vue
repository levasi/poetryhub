<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div
    role="tablist"
    :aria-label="label"
    class="ds-tabs"
  >
    <slot />
  </div>
</template>
