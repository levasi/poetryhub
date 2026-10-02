<script setup lang="ts">
import { computed, useSlots } from 'vue'

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
  }>(),
  { variant: 'default' },
)

const slots = useSlots()

const hasIcon = computed(() => Boolean(slots.icon))
</script>

<template>
  <div
    role="alert"
    data-slot="alert"
    class="alert"
    :class="[
      hasIcon ? 'alert--with-icon' : 'alert--no-icon',
      `alert--${variant}`,
    ]"
  >
    <div
      v-if="hasIcon"
      data-slot="alert-icon"
      class="alert__icon"
    >
      <slot name="icon" />
    </div>

    <slot />
  </div>
</template>
