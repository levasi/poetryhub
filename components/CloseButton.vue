<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Accessible name (aria-label). */
    label: string
    title?: string
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  { size: 'sm' },
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    class="ds-icon-btn close-button"
    :class="{ 'close-button--md': size === 'md' }"
    :aria-label="label"
    :title="title ?? label"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <svg
      class="close-button__icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</template>
