<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="ds-empty">
    <DsFleuron class="ds-empty__fleuron" />
    <p class="ds-empty__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="ds-empty__description"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="ds-empty__actions"
    >
      <slot />
    </div>
  </div>
</template>
