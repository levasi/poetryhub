<script setup lang="ts">
const props = defineProps<{
  active?: boolean
  /** Stable id for aria-controls when paired with a tabpanel. */
  tabId?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    role="tab"
    class="ds-tab"
    :class="{ 'ds-tab-active': active }"
    :id="tabId"
    :aria-selected="active ? 'true' : 'false'"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
