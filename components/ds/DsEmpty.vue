<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="ds-empty">
    <DsFleuron class="mb-6" />
    <p class="font-serif text-lg font-semibold tracking-tight text-content">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="mt-2 max-w-sm text-ui-sm text-content-muted"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-6"
    >
      <slot />
    </div>
  </div>
</template>
