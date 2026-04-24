<script setup lang="ts">
/**
 * Last-slide CTA: extra line spacing, larger type; "poetry" accent + "hub.ro" contrast per theme.
 */
import type { CarouselTheme } from '~/composables/useCarouselGenerator'

const props = defineProps<{
  ctaText: string
  theme: CarouselTheme
}>()

function parsePoetryHub(line: string) {
  const full = line.trim()
  const m = full.match(/^(poetry)(hub\.ro)$/i)
  if (!m) return null
  const i = full.toLowerCase().indexOf('poetry')
  if (i < 0) return null
  return {
    before: full.slice(0, i),
    poetry: full.slice(i, i + 'poetry'.length),
    hub: full.slice(i + 'poetry'.length),
  }
}

type Row =
  | { kind: 'plain'; text: string }
  | { kind: 'brand'; before: string; poetry: string; hub: string }

const rows = computed((): Row[] => {
  const out: Row[] = []
  for (const line of props.ctaText.split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue
    const brand = parsePoetryHub(t)
    if (brand) out.push({ kind: 'brand', ...brand })
    else out.push({ kind: 'plain', text: t })
  }
  return out
})

const poetryClass = computed(() => {
  switch (props.theme) {
    case 'minimal':
    case 'dark':
      return 'text-gold-400'
    case 'gradient':
      return 'text-amber-200'
    case 'neon':
      return 'text-yellow-300'
    case 'parchment':
      return 'text-amber-900'
    case 'ocean':
      return 'text-cyan-200'
    case 'sunset':
      return 'text-amber-50'
    case 'editorial':
      return 'text-red-700'
    case 'forest':
      return 'text-amber-400'
    case 'cosmos':
      return 'text-violet-300'
    default:
      return 'text-gold-400'
  }
})

const hubClass = computed(() => {
  switch (props.theme) {
    case 'minimal':
      return 'text-ink-900'
    case 'parchment':
      return 'text-amber-950'
    case 'editorial':
      return 'text-zinc-950'
    default:
      return 'text-white'
  }
})

const plainClass = computed(() => {
  switch (props.theme) {
    case 'minimal':
      return 'text-ink-900'
    case 'parchment':
      return 'text-amber-950'
    case 'editorial':
      return 'text-zinc-900'
    case 'dark':
      return 'text-ink-50'
    case 'gradient':
      return 'text-white'
    case 'neon':
      return 'text-fuchsia-300'
    case 'ocean':
      return 'text-cyan-50'
    case 'sunset':
      return 'text-white'
    case 'forest':
      return 'text-emerald-50'
    case 'cosmos':
      return 'text-violet-100'
    default:
      return ''
  }
})

const blockClass = computed(() => {
  switch (props.theme) {
    case 'minimal':
      return 'text-5xl font-semibold sm:text-[3.1rem]'
    case 'parchment':
      return 'text-[3rem] font-semibold sm:text-[3.2rem] tracking-tight'
    case 'editorial':
      return 'text-[2.95rem] font-bold sm:text-[3.15rem] tracking-tight text-balance'
    case 'dark':
      return 'text-[3.15rem] font-semibold sm:text-[3.35rem]'
    case 'ocean':
      return 'text-[3.1rem] font-semibold sm:text-[3.3rem]'
    case 'forest':
      return 'text-[3.1rem] font-semibold sm:text-[3.28rem]'
    case 'gradient':
      return 'text-[3rem] font-semibold sm:text-[3.2rem] drop-shadow-md'
    case 'sunset':
      return 'text-[3.05rem] font-bold sm:text-[3.22rem] drop-shadow-lg'
    case 'neon':
      return 'text-[3.1rem] font-black sm:text-[3.35rem] tracking-tight [text-shadow:0_0_36px_rgba(217,70,239,0.4)]'
    case 'cosmos':
      return 'text-[3.05rem] font-black sm:text-[3.28rem] tracking-tight [text-shadow:0_0_40px_rgba(167,139,250,0.45)]'
    default:
      return 'text-5xl font-semibold'
  }
})
</script>

<template>
  <div
    class="flex max-w-[920px] flex-col items-center gap-10 text-center sm:gap-12"
    :class="blockClass"
  >
    <template v-for="(row, idx) in rows" :key="idx">
      <p v-if="row.kind === 'plain'" class="leading-[1.35]" :class="plainClass">
        {{ row.text }}
      </p>
      <p v-else class="leading-[1.35]">
        <span v-if="row.before">{{ row.before }}</span>
        <span :class="poetryClass">{{ row.poetry }}</span>
        <span :class="hubClass">{{ row.hub }}</span>
      </p>
    </template>
  </div>
</template>
