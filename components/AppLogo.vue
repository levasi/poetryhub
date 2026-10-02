<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Show the ✦ mark before the wordmark. */
    showMark?: boolean
    size?: 'sm' | 'md'
  }>(),
  { showMark: true, size: 'md' },
)
</script>

<template>
  <span
    class="app-logo"
    :class="{ 'app-logo--sm': size === 'sm' }"
  >
    <img
      v-if="showMark"
      src="/mark-luceafar.svg"
      alt=""
      class="app-logo__mark"
      width="24"
      height="24"
    >
    <span class="app-logo__wordmark">
      Poetry<span class="app-logo__hub">Hub</span>
    </span>
  </span>
</template>
