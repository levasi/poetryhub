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
  <div class="group/tooltip relative flex justify-center">
    <slot />
    <div
      role="tooltip"
      class="pointer-events-none absolute z-50 w-max max-w-[13rem] rounded-ds-md border border-edge-subtle bg-surface-overlay px-2.5 py-1.5 text-left opacity-0 shadow-ds-popover transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      :class="
        placement === 'right'
          ? 'left-full top-1/2 ml-2 -translate-y-1/2'
          : 'right-full top-1/2 mr-2 -translate-y-1/2'
      "
    >
      <p class="text-ui-xs font-medium leading-snug text-content">
        {{ label }}
      </p>
      <p v-if="hint" class="mt-0.5 text-ui-xs leading-snug text-content-muted">
        {{ hint }}
      </p>
    </div>
  </div>
</template>
