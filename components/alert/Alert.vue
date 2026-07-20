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

const variantClass = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return [
        'border-danger/35 bg-danger-soft',
        '[&_[data-slot=alert-title]]:text-danger',
        '[&_[data-slot=alert-icon]]:text-danger',
        '[&_[data-slot=alert-description]]:text-content-secondary',
      ]
    case 'warning':
      return [
        'border-amber-300/60 bg-amber-50/90',
        '[&_[data-slot=alert-title]]:text-amber-950',
        '[&_[data-slot=alert-icon]]:text-amber-600',
        '[&_[data-slot=alert-description]]:text-amber-900/80',
      ]
    case 'success':
      return [
        'border-emerald-300/60 bg-emerald-50/90',
        '[&_[data-slot=alert-title]]:text-emerald-950',
        '[&_[data-slot=alert-icon]]:text-emerald-600',
        '[&_[data-slot=alert-description]]:text-emerald-900/80',
      ]
    case 'info':
      return [
        'border-brand/35 bg-brand-soft/25',
        '[&_[data-slot=alert-title]]:text-content',
        '[&_[data-slot=alert-icon]]:text-brand',
        '[&_[data-slot=alert-description]]:text-content-secondary',
      ]
    default:
      return [
        'border-edge-subtle bg-surface-subtle',
        '[&_[data-slot=alert-title]]:text-content',
        '[&_[data-slot=alert-icon]]:text-content-muted',
        '[&_[data-slot=alert-description]]:text-content-muted',
      ]
  }
})
</script>

<template>
  <div role="alert" data-slot="alert"
    class="relative grid w-full items-start gap-y-0.5 rounded-ds-lg border px-4 py-3 text-sm text-content has-[_[data-slot=alert-action]]:pe-14"
    :class="[
      hasIcon ? 'grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3' : 'grid-cols-[minmax(0,1fr)]',
      variantClass,
    ]">
    <div v-if="hasIcon" data-slot="alert-icon" class="col-start-1 row-start-1 pt-0.5 [&_svg]:size-4">
      <slot name="icon" />
    </div>

    <slot />
  </div>
</template>
