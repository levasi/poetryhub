<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { simpleIconsInstagram } from '~/utils/iconify/simpleIconsInstagram'

const props = withDefaults(
  defineProps<{
    slug: string
    /** Hit target + glyph scale */
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const { t } = useI18n()
</script>

<template>
  <NuxtLink
    :to="{ path: '/carousel-generator', query: { slug } }"
    class="poem-carousel-icon"
    :class="`poem-carousel-icon--${size}`"
    :aria-label="t('carousel.openGenerator')"
    :title="t('carousel.openGenerator')"
    @click.stop
  >
    <Icon
      :icon="simpleIconsInstagram"
      class="poem-carousel-icon__glyph"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
