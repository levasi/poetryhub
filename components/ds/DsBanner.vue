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
      class="ds-banner__icon"
      :class="`ds-banner__icon--${variant}`"
      aria-hidden="true"
    />
    <div class="ds-banner__body">
      <p
        v-if="title"
        class="ds-banner__title"
      >
        {{ title }}
      </p>
      <div
        class="ds-banner__content"
        :class="{ 'ds-banner__content--spaced': title }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
