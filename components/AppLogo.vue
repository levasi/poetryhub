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
    class="group inline-flex min-w-0 items-center gap-2"
    :class="size === 'sm' ? 'gap-1.5' : 'gap-2'"
  >
    <img
      v-if="showMark"
      src="/mark-luceafar.svg"
      alt=""
      class="shrink-0"
      :class="size === 'sm' ? 'size-5' : 'size-6'"
      width="24"
      height="24"
    >
    <span
      class="font-serif font-semibold tracking-tight text-content"
      :class="size === 'sm' ? 'text-lg' : 'text-xl'"
    >
      Poetry<span class="text-brand">Hub</span>
    </span>
  </span>
</template>
