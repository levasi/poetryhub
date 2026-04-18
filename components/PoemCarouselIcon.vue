<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { simpleIconsInstagram } from '~/utils/iconify/simpleIconsInstagram'

const SIZE_CLASSES = {
  xs: { box: 'h-6 w-6', icon: 'h-3 w-3' },
  sm: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  lg: { box: 'h-11 w-11', icon: 'h-5 w-5' },
} as const

const props = withDefaults(
  defineProps<{
    slug: string
    /** Hit target + glyph scale */
    size?: keyof typeof SIZE_CLASSES
  }>(),
  { size: 'md' },
)

const { t } = useI18n()

const box = computed(() => SIZE_CLASSES[props.size].box)
const icon = computed(() => SIZE_CLASSES[props.size].icon)
</script>

<template>
  <NuxtLink
    :to="{ path: '/carousel-generator', query: { slug } }"
    class="inline-flex shrink-0 items-center justify-center rounded-lg text-content-soft ring-edge-subtle transition-colors hover:bg-surface-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    :class="box"
    :aria-label="t('carousel.openGenerator')"
    :title="t('carousel.openGenerator')"
    @click.stop
  >
    <Icon :icon="simpleIconsInstagram" :class="[icon, 'shrink-0']" aria-hidden="true" />
  </NuxtLink>
</template>
