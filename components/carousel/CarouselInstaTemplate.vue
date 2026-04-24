<script setup lang="ts">
import type { CarouselTheme, SlideVariant } from '~/composables/useCarouselGenerator'
import {
  CAROUSEL_WIDTH,
  CAROUSEL_HEIGHT,
  PHI,
  coverAvatarDiameterPxFromTitle,
  coverGoldenSpacingPx,
  goldenSecondaryPxFromTitle,
} from '~/composables/useCarouselGenerator'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'

const props = withDefaults(
  defineProps<{
    /** Visual theme (formerly four separate template components). */
    theme: CarouselTheme
    variant: SlideVariant
    title: string
    author: string
    authorNationality?: string
    authorLifespan?: string
    writtenYearLine?: string
    avatarUrl?: string
    lines?: string[]
    ctaText: string
    fontScaleBody: number
    titleScale: number
    keywords: string[]
    bodyFontSizeScale?: number
    bodyLineHeight?: number
    fontFamily?: string
    /** Inline CSS weight for verse slides; null = keep theme Tailwind classes. */
    bodyFontWeight?: number | null
    /** Inline CSS weight for cover title; null = keep theme classes. */
    titleFontWeight?: number | null
  }>(),
  {
    authorNationality: '',
    authorLifespan: '',
    writtenYearLine: '',
    avatarUrl: '',
    bodyFontSizeScale: 1,
    bodyLineHeight: 1.65,
    fontFamily: () => READER_FONT_STACKS.literata,
    bodyFontWeight: null,
    titleFontWeight: null,
  },
)

type Tok = {
  rootClass: string
  rootStyle: Record<string, string>
  overlays: { key: string; class?: string; style?: string }[]
  coverTitleMult: number
  coverDividerMult: number
  avatarClass: string
  coverTitleClass: string
  coverWrittenClass: string
  coverDividerClass: string
  coverAuthorClass: string
  coverMetaNatClass: string
  coverMetaLifeClass: string
  bodyPad: string
  bodyOuterClass: string
  bodyInnerClass: string
  bodyBaseMult: number
  verseMarkClass: string
  ctaTheme: CarouselTheme
  /** Padding on last-slide CTA block */
  ctaPadClass: string
}

function themeTokens(t: CarouselTheme): Tok {
  switch (t) {
    case 'minimal':
      return {
        rootClass:
          'carousel-canvas template-minimal relative flex flex-col overflow-hidden bg-white text-ink-900 antialiased',
        rootStyle: {},
        overlays: [],
        coverTitleMult: 68,
        coverDividerMult: 132,
        avatarClass: 'rounded-full object-cover shadow-lg ring-4 ring-ink-200/90',
        coverTitleClass: 'font-semibold leading-[1.12] text-ink-900',
        coverWrittenClass: 'tabular-nums text-ink-500',
        coverDividerClass: 'h-px bg-ink-300',
        coverAuthorClass: 'font-medium tracking-wide text-ink-600',
        coverMetaNatClass: 'text-ink-500',
        coverMetaLifeClass: 'tabular-nums text-ink-500',
        bodyPad: 'px-2',
        bodyOuterClass: 'flex h-full flex-col justify-center text-center text-ink-800',
        bodyInnerClass: '',
        bodyBaseMult: 40,
        verseMarkClass: 'bg-gold-200/80 text-ink-900',
        ctaTheme: 'minimal',
        ctaPadClass: 'px-8',
      }
    case 'dark':
      return {
        rootClass: 'carousel-canvas template-dark relative flex flex-col overflow-hidden antialiased',
        rootStyle: {
          background: 'linear-gradient(165deg, #0a0a0c 0%, #14141a 45%, #0c0c0e 100%)',
        },
        overlays: [
          {
            key: 'dark-glow',
            class: 'pointer-events-none absolute inset-0 opacity-[0.07]',
            style:
              'background-image: radial-gradient(circle at 20% 30%, #e8a800 0%, transparent 45%), radial-gradient(circle at 80% 70%, #f5f5f0 0%, transparent 40%);',
          },
        ],
        coverTitleMult: 72,
        coverDividerMult: 136,
        avatarClass: 'rounded-full object-cover shadow-xl ring-4 ring-gold-500/35',
        coverTitleClass: 'font-semibold leading-[1.12] text-ink-50',
        coverWrittenClass: 'tabular-nums text-ink-400',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-gold-500/80 to-transparent',
        coverAuthorClass: 'font-medium tracking-wide text-ink-300',
        coverMetaNatClass: 'text-ink-400',
        coverMetaLifeClass: 'tabular-nums text-ink-400',
        bodyPad: 'px-4',
        bodyOuterClass: 'relative flex h-full flex-col justify-center text-center text-ink-100',
        bodyInnerClass: 'text-balance',
        bodyBaseMult: 38,
        verseMarkClass: 'bg-gold-500/25 text-gold-300',
        ctaTheme: 'dark',
        ctaPadClass: 'px-10',
      }
    case 'gradient':
      return {
        rootClass:
          'carousel-canvas template-gradient relative flex flex-col overflow-hidden text-white antialiased',
        rootStyle: {
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #5b21b6 100%)',
        },
        overlays: [
          {
            key: 'g1',
            class:
              'pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full bg-violet-400/20 blur-3xl',
          },
          {
            key: 'g2',
            class:
              'pointer-events-none absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl',
          },
        ],
        coverTitleMult: 68,
        coverDividerMult: 140,
        avatarClass: 'rounded-full object-cover shadow-xl ring-4 ring-white/40',
        coverTitleClass: 'font-bold leading-[1.1] drop-shadow-md',
        coverWrittenClass: 'tabular-nums text-white/70',
        coverDividerClass: 'h-1 rounded-full bg-white/35',
        coverAuthorClass: 'font-medium text-white/85',
        coverMetaNatClass: 'text-white/70',
        coverMetaLifeClass: 'tabular-nums text-white/70',
        bodyPad: 'px-6',
        bodyOuterClass: 'relative flex h-full flex-col justify-center text-center text-white/95',
        bodyInnerClass: 'drop-shadow-sm',
        bodyBaseMult: 37,
        verseMarkClass: 'rounded bg-white/20 px-1 text-white',
        ctaTheme: 'gradient',
        ctaPadClass: 'px-10',
      }
    case 'neon':
      return {
        rootClass: 'carousel-canvas template-neon relative flex flex-col overflow-hidden antialiased',
        rootStyle: { background: '#030712' },
        overlays: [
          {
            key: 'neon-grid',
            class: 'pointer-events-none absolute inset-0 opacity-40',
            style:
              'background-image: linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.06) 1px, transparent 1px); background-size: 48px 48px;',
          },
        ],
        coverTitleMult: 66,
        coverDividerMult: 128,
        avatarClass:
          'rounded-full object-cover ring-4 ring-emerald-400/50 shadow-[0_0_40px_rgba(52,211,153,0.35)]',
        coverTitleClass: 'font-black uppercase tracking-tight text-emerald-300',
        coverWrittenClass: 'tabular-nums text-emerald-200/75',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent',
        coverAuthorClass: 'font-semibold tracking-[0.2em] text-cyan-200/90',
        coverMetaNatClass: 'tracking-wide text-emerald-200/75',
        coverMetaLifeClass: 'tabular-nums text-emerald-200/75',
        bodyPad: 'px-5',
        bodyOuterClass:
          'relative flex h-full flex-col justify-center text-center font-semibold text-emerald-100/95',
        bodyInnerClass: '',
        bodyBaseMult: 34,
        verseMarkClass: 'bg-fuchsia-600/50 text-white px-1 rounded',
        ctaTheme: 'neon',
        ctaPadClass: 'px-8',
      }
    case 'parchment':
      return {
        rootClass:
          'carousel-canvas template-parchment relative flex flex-col overflow-hidden text-amber-950 antialiased',
        rootStyle: {
          background: 'linear-gradient(180deg, #faf6ee 0%, #f2e8d8 48%, #e8dcc8 100%)',
        },
        overlays: [
          {
            key: 'parchment-vignette',
            class: 'pointer-events-none absolute inset-0 opacity-[0.14]',
            style:
              'background: radial-gradient(ellipse at 50% 20%, transparent 40%, rgba(120,53,15,0.12) 100%);',
          },
        ],
        coverTitleMult: 68,
        coverDividerMult: 132,
        avatarClass: 'rounded-full object-cover shadow-lg ring-4 ring-amber-800/25',
        coverTitleClass: 'font-semibold leading-[1.12] text-amber-950',
        coverWrittenClass: 'tabular-nums text-amber-800/80',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent',
        coverAuthorClass: 'font-medium tracking-wide text-amber-900',
        coverMetaNatClass: 'text-amber-800/85',
        coverMetaLifeClass: 'tabular-nums text-amber-800/85',
        bodyPad: 'px-3',
        bodyOuterClass: 'flex h-full flex-col justify-center text-center text-amber-950/95',
        bodyInnerClass: '',
        bodyBaseMult: 39,
        verseMarkClass: 'rounded bg-amber-300/85 px-1 text-amber-950',
        ctaTheme: 'parchment',
        ctaPadClass: 'px-8',
      }
    case 'ocean':
      return {
        rootClass: 'carousel-canvas template-ocean relative flex flex-col overflow-hidden antialiased',
        rootStyle: {
          background: 'linear-gradient(165deg, #0c4a6e 0%, #0e7490 42%, #155e75 100%)',
        },
        overlays: [
          {
            key: 'ocean-caustic',
            class: 'pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light',
            style:
              'background-image: radial-gradient(ellipse 80% 50% at 30% 20%, rgba(165,243,252,0.45) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 70% 80%, rgba(34,211,238,0.25) 0%, transparent 50%);',
          },
        ],
        coverTitleMult: 70,
        coverDividerMult: 134,
        avatarClass: 'rounded-full object-cover shadow-xl ring-4 ring-cyan-300/40',
        coverTitleClass: 'font-semibold leading-[1.12] text-cyan-50',
        coverWrittenClass: 'tabular-nums text-cyan-200/80',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent',
        coverAuthorClass: 'font-medium tracking-wide text-cyan-100',
        coverMetaNatClass: 'text-cyan-200/85',
        coverMetaLifeClass: 'tabular-nums text-cyan-200/85',
        bodyPad: 'px-4',
        bodyOuterClass: 'relative flex h-full flex-col justify-center text-center text-cyan-50/95',
        bodyInnerClass: 'text-balance',
        bodyBaseMult: 38,
        verseMarkClass: 'rounded bg-cyan-400/30 px-1 text-cyan-50',
        ctaTheme: 'ocean',
        ctaPadClass: 'px-10',
      }
    case 'sunset':
      return {
        rootClass:
          'carousel-canvas template-sunset relative flex flex-col overflow-hidden text-white antialiased',
        rootStyle: {
          background: 'linear-gradient(138deg, #9f1239 0%, #c2410c 38%, #ea580c 62%, #fbbf24 100%)',
        },
        overlays: [
          {
            key: 'sunset-bloom',
            class:
              'pointer-events-none absolute -right-16 top-1/4 h-[420px] w-[420px] rounded-full bg-rose-400/25 blur-3xl',
          },
          {
            key: 'sunset-glow',
            class:
              'pointer-events-none absolute -bottom-24 -left-12 h-[380px] w-[380px] rounded-full bg-amber-300/20 blur-3xl',
          },
        ],
        coverTitleMult: 68,
        coverDividerMult: 138,
        avatarClass: 'rounded-full object-cover shadow-xl ring-4 ring-white/45',
        coverTitleClass: 'font-bold leading-[1.1] text-white drop-shadow-lg',
        coverWrittenClass: 'tabular-nums text-white/80',
        coverDividerClass: 'h-1 rounded-full bg-white/40',
        coverAuthorClass: 'font-semibold text-white/92',
        coverMetaNatClass: 'text-white/78',
        coverMetaLifeClass: 'tabular-nums text-white/78',
        bodyPad: 'px-6',
        bodyOuterClass: 'relative flex h-full flex-col justify-center text-center text-white/95',
        bodyInnerClass: 'drop-shadow-md',
        bodyBaseMult: 37,
        verseMarkClass: 'rounded bg-white/30 px-1 text-white backdrop-blur-[2px]',
        ctaTheme: 'sunset',
        ctaPadClass: 'px-10',
      }
    case 'editorial':
      return {
        rootClass:
          'carousel-canvas template-editorial relative flex flex-col overflow-hidden bg-zinc-50 text-zinc-900 antialiased',
        rootStyle: {},
        overlays: [
          {
            key: 'editorial-rule',
            class: 'pointer-events-none absolute left-1/2 top-[5.5rem] z-[1] h-[3px] w-44 -translate-x-1/2 bg-red-600 sm:top-[6rem]',
          },
          {
            key: 'editorial-grid',
            class: 'pointer-events-none absolute inset-0 opacity-[0.055]',
            style:
              'background-image: linear-gradient(to right, rgba(24,24,27,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.07) 1px, transparent 1px); background-size: 26px 26px;',
          },
        ],
        coverTitleMult: 70,
        coverDividerMult: 130,
        avatarClass: 'rounded-full object-cover shadow-md ring-4 ring-zinc-300/90',
        coverTitleClass: 'font-bold leading-[1.08] tracking-tight text-zinc-950',
        coverWrittenClass: 'tabular-nums text-zinc-500',
        coverDividerClass: 'h-[2px] w-full max-w-[min(92%,520px)] bg-zinc-900',
        coverAuthorClass: 'font-medium uppercase tracking-[0.18em] text-zinc-700',
        coverMetaNatClass: 'text-zinc-500',
        coverMetaLifeClass: 'tabular-nums text-zinc-500',
        bodyPad: 'px-5',
        bodyOuterClass: 'flex h-full flex-col justify-center text-center text-zinc-800',
        bodyInnerClass: '',
        bodyBaseMult: 39,
        verseMarkClass: 'bg-red-100 px-1 text-zinc-900',
        ctaTheme: 'editorial',
        ctaPadClass: 'px-8',
      }
    case 'forest':
      return {
        rootClass: 'carousel-canvas template-forest relative flex flex-col overflow-hidden antialiased',
        rootStyle: {
          background: 'linear-gradient(168deg, #022c22 0%, #14532d 45%, #166534 100%)',
        },
        overlays: [
          {
            key: 'forest-mist',
            class: 'pointer-events-none absolute inset-0 opacity-30',
            style:
              'background-image: radial-gradient(ellipse 70% 40% at 50% 100%, rgba(20,83,45,0.9) 0%, transparent 60%);',
          },
        ],
        coverTitleMult: 69,
        coverDividerMult: 134,
        avatarClass: 'rounded-full object-cover shadow-xl ring-4 ring-amber-500/40',
        coverTitleClass: 'font-semibold leading-[1.12] text-amber-50',
        coverWrittenClass: 'tabular-nums text-emerald-300/85',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent',
        coverAuthorClass: 'font-medium tracking-wide text-emerald-100',
        coverMetaNatClass: 'text-emerald-300/90',
        coverMetaLifeClass: 'tabular-nums text-emerald-300/90',
        bodyPad: 'px-4',
        bodyOuterClass: 'relative flex h-full flex-col justify-center text-center text-emerald-50/95',
        bodyInnerClass: '',
        bodyBaseMult: 38,
        verseMarkClass: 'rounded bg-amber-400/35 px-1 text-amber-50',
        ctaTheme: 'forest',
        ctaPadClass: 'px-10',
      }
    case 'cosmos':
      return {
        rootClass: 'carousel-canvas template-cosmos relative flex flex-col overflow-hidden antialiased',
        rootStyle: {
          background: 'linear-gradient(165deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
        },
        overlays: [
          {
            key: 'cosmos-stars',
            class: 'pointer-events-none absolute inset-0 opacity-[0.35]',
            style:
              'background-image: radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,0.9) 50%, transparent 52%), radial-gradient(1px 1px at 78% 22%, rgba(255,255,255,0.75) 50%, transparent 52%), radial-gradient(1.5px 1.5px at 44% 62%, rgba(255,255,255,0.85) 50%, transparent 52%), radial-gradient(1px 1px at 88% 72%, rgba(255,255,255,0.7) 50%, transparent 52%), radial-gradient(1px 1px at 22% 85%, rgba(255,255,255,0.65) 50%, transparent 52%); background-size: 100% 100%;',
          },
          {
            key: 'cosmos-nebula',
            class:
              'pointer-events-none absolute -left-20 top-1/3 h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-3xl',
          },
        ],
        coverTitleMult: 66,
        coverDividerMult: 130,
        avatarClass:
          'rounded-full object-cover ring-4 ring-violet-400/45 shadow-[0_0_48px_rgba(139,92,246,0.35)]',
        coverTitleClass: 'font-bold leading-[1.1] tracking-tight text-violet-100',
        coverWrittenClass: 'tabular-nums text-violet-300/80',
        coverDividerClass: 'h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent',
        coverAuthorClass: 'font-medium tracking-[0.12em] text-indigo-200/95',
        coverMetaNatClass: 'text-violet-300/85',
        coverMetaLifeClass: 'tabular-nums text-violet-300/85',
        bodyPad: 'px-5',
        bodyOuterClass:
          'relative flex h-full flex-col justify-center text-center font-medium text-violet-50/95',
        bodyInnerClass: '',
        bodyBaseMult: 35,
        verseMarkClass: 'rounded bg-fuchsia-600/45 px-1 text-violet-50',
        ctaTheme: 'cosmos',
        ctaPadClass: 'px-8',
      }
  }
}

const tok = computed(() => themeTokens(props.theme))

const coverTitlePx = computed(() => Math.round(tok.value.coverTitleMult * props.titleScale))
const coverAuthorPx = computed(() => goldenSecondaryPxFromTitle(coverTitlePx.value))
const coverAvatarPx = computed(() => coverAvatarDiameterPxFromTitle(coverTitlePx.value))
const coverGap1 = computed(() => coverGoldenSpacingPx(props.titleScale, 1))
const coverDividerW = computed(() => Math.round(tok.value.coverDividerMult * PHI))
const coverMetaPx = computed(() => Math.max(13, goldenSecondaryPxFromTitle(coverAuthorPx.value)))
const coverMetaGap = computed(() => coverGoldenSpacingPx(props.titleScale, 0))
const coverMetaBetween = computed(() => Math.round(coverMetaGap.value * 0.45))
const hasAuthorMeta = computed(
  () => !!(props.authorNationality?.trim() || props.authorLifespan?.trim()),
)

/** Cover title max-width / glow — themes with oversized display type or neon glow */
const THEMES_WIDE_TITLE = new Set<CarouselTheme>(['neon', 'cosmos'])

const coverTitleStyle = computed(() => {
  const base: Record<string, string> = {
    fontSize: `${coverTitlePx.value}px`,
    maxWidth: THEMES_WIDE_TITLE.has(props.theme) ? '940px' : '920px',
  }
  if (props.titleFontWeight != null) {
    base.fontWeight = String(props.titleFontWeight)
  }
  if (props.theme === 'neon') {
    base.textShadow = '0 0 40px rgba(52, 211, 153, 0.45), 0 0 80px rgba(16, 185, 129, 0.2)'
  }
  if (props.theme === 'cosmos') {
    base.textShadow = '0 0 36px rgba(167, 139, 250, 0.45), 0 0 72px rgba(99, 102, 241, 0.28)'
  }
  if (props.theme === 'sunset') {
    base.textShadow = '0 2px 28px rgba(0, 0, 0, 0.35)'
  }
  return base
})

const bodyGapPx = computed(() => {
  const mult = tok.value.bodyBaseMult * props.fontScaleBody * props.bodyFontSizeScale
  return Math.round(mult * Math.max(0, props.bodyLineHeight - 1) * 0.5)
})

const bodyFontPx = computed(() =>
  Math.round(tok.value.bodyBaseMult * props.fontScaleBody * props.bodyFontSizeScale),
)

const bodyShadowStyle = computed(() => {
  if (props.theme === 'neon') return { textShadow: '0 0 24px rgba(52, 211, 153, 0.25)' }
  if (props.theme === 'cosmos') return { textShadow: '0 0 22px rgba(167, 139, 250, 0.22)' }
  return {}
})

const bodySlideTypographyStyle = computed(() => ({
  fontSize: `${bodyFontPx.value}px`,
  lineHeight: props.bodyLineHeight,
  gap: `${bodyGapPx.value}px`,
  ...bodyShadowStyle.value,
  ...(props.bodyFontWeight != null ? { fontWeight: String(props.bodyFontWeight) } : {}),
}))

/** Layered backgrounds need `relative` for overlay stacking */
const THEMES_COVER_RELATIVE = new Set<CarouselTheme>([
  'dark',
  'gradient',
  'neon',
  'ocean',
  'sunset',
  'forest',
  'cosmos',
  'editorial',
])
const coverShellRelative = computed(() => THEMES_COVER_RELATIVE.has(props.theme))

const THEMES_CTA_RELATIVE = new Set<CarouselTheme>([
  'dark',
  'gradient',
  'neon',
  'ocean',
  'sunset',
  'forest',
  'cosmos',
  'editorial',
])
const ctaShellRelative = computed(() => THEMES_CTA_RELATIVE.has(props.theme))

const canvasStyle = computed(() => ({
  width: `${CAROUSEL_WIDTH}px`,
  height: `${CAROUSEL_HEIGHT}px`,
  padding: '56px',
  boxSizing: 'border-box' as const,
  fontFamily: props.fontFamily,
  ...tok.value.rootStyle,
}))
</script>

<template>
  <div :class="tok.rootClass" :style="canvasStyle">
    <div v-for="o in tok.overlays" :key="o.key" :class="o.class" :style="o.style" />

    <template v-if="variant === 'cover'">
      <div class="flex h-full flex-col items-center justify-center text-center"
        :class="coverShellRelative ? 'relative' : ''">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" :class="tok.avatarClass" width="236" height="236" :style="{
          width: `${coverAvatarPx}px`,
          height: `${coverAvatarPx}px`,
          marginBottom: `${coverGap1}px`,
        }" />
        <p :class="tok.coverTitleClass" :style="coverTitleStyle">
          {{ title }}
        </p>
        <p v-if="writtenYearLine?.trim()" :class="tok.coverWrittenClass" :style="{
          fontSize: `${coverMetaPx}px`,
          marginTop: `${coverMetaGap}px`,
          letterSpacing: '0.02em',
        }">
          {{ writtenYearLine.trim() }}
        </p>
        <div :class="tok.coverDividerClass" :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }" />
        <p :class="tok.coverAuthorClass" :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }">
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p v-if="authorNationality?.trim()" :class="tok.coverMetaNatClass" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: theme === 'neon' ? undefined : '0.02em',
          }">
            {{ authorNationality.trim() }}
          </p>
          <p v-if="authorLifespan?.trim()" :class="tok.coverMetaLifeClass" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
          }">
            {{ authorLifespan.trim() }}
          </p>
        </template>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div :class="[tok.bodyOuterClass, tok.bodyPad]" :style="bodySlideTypographyStyle">
        <p v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap" :class="tok.bodyInnerClass">
          <CarouselVerseLine :line="line" :keywords="keywords" :mark-class="tok.verseMarkClass" />
        </p>
      </div>
    </template>

    <template v-else>
      <div class="flex h-full flex-col items-center justify-center text-center" :class="[
        ctaShellRelative ? 'relative' : '',
        tok.ctaPadClass,
      ]">
        <CarouselSlideCta :cta-text="ctaText" :theme="tok.ctaTheme" />
      </div>
    </template>

    <CarouselSlideBrand :theme="tok.ctaTheme" />
  </div>
</template>
