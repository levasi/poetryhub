<script setup lang="ts">
import { Icon } from '@iconify/vue'

export type DsBannerVariant = 'danger' | 'success' | 'info'

const props = withDefaults(
  defineProps<{
    variant?: DsBannerVariant
    title?: string
  }>(),
  { variant: 'info' },
)

const iconName = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'heroicons:exclamation-circle'
    case 'success':
      return 'heroicons:check-circle'
    default:
      return 'heroicons:information-circle'
  }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'ds-banner-danger'
    case 'success':
      return 'ds-banner-success'
    default:
      return 'ds-banner-info'
  }
})
</script>

<template>
  <div
    role="alert"
    class="ds-banner"
    :class="variantClass"
  >
    <Icon
      :icon="iconName"
      class="mt-0.5 size-5 shrink-0"
      :class="{
        'text-danger': variant === 'danger',
        'text-success': variant === 'success',
        'text-brand': variant === 'info',
      }"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p
        v-if="title"
        class="font-medium text-content"
      >
        {{ title }}
      </p>
      <div
        class="text-content-secondary"
        :class="title ? 'mt-0.5' : ''"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
