<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { simpleIconsInstagram } from '~/utils/iconify/simpleIconsInstagram'

const props = withDefaults(
  defineProps<{
    slug: string
    /** Icon box size (Tailwind h/w) */
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const { t } = useI18n()

const box = computed(() => (props.size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'))
const icon = computed(() => (props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'))
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
