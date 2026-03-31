<script setup lang="ts">
import { highlightSegments } from '~/composables/useCarouselGenerator'

const props = withDefaults(
  defineProps<{
    line: string
    keywords: string[]
    markClass?: string
  }>(),
  { markClass: 'carousel-keyword' },
)

const parts = computed(() => highlightSegments(props.line, props.keywords))
</script>

<template>
  <!-- Explicit blank line from textarea: keep vertical space -->
  <span v-if="line === ''" class="block min-h-[0.55em]" aria-hidden="true">&nbsp;</span>
  <span v-else class="inline-block max-w-full">
    <template v-for="(p, i) in parts" :key="i">
      <mark v-if="p.mark" :class="markClass">{{ p.text }}</mark>
      <span v-else>{{ p.text }}</span>
    </template>
  </span>
</template>
