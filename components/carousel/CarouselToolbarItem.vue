<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    hint?: string
    /** Where the tooltip appears relative to the control. */
    placement?: 'left' | 'right'
  }>(),
  { placement: 'right' },
)
</script>

<template>
  <div class="carousel-toolbar-item">
    <slot />
    <div
      role="tooltip"
      class="carousel-toolbar-item__tooltip"
      :class="placement === 'right' ? 'carousel-toolbar-item__tooltip--right' : 'carousel-toolbar-item__tooltip--left'"
    >
      <p class="carousel-toolbar-item__label">
        {{ label }}
      </p>
      <p
        v-if="hint"
        class="carousel-toolbar-item__hint"
      >
        {{ hint }}
      </p>
    </div>
  </div>
</template>
