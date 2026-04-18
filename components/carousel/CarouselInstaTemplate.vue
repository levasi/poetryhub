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
  }>(),
  {
    authorNationality: '',
    authorLifespan: '',
    writtenYearLine: '',
    avatarUrl: '',
    bodyFontSizeScale: 1,
    bodyLineHeight: 1.65,
    fontFamily: () => READER_FONT_STACKS.literata,
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

const coverTitleStyle = computed(() => {
  const base: Record<string, string> = {
    fontSize: `${coverTitlePx.value}px`,
    maxWidth: props.theme === 'neon' ? '940px' : '920px',
  }
  if (props.theme === 'neon') {
    base.textShadow = '0 0 40px rgba(52, 211, 153, 0.45), 0 0 80px rgba(16, 185, 129, 0.2)'
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

const bodyShadowStyle = computed(() =>
  props.theme === 'neon'
    ? {
        textShadow: '0 0 24px rgba(52, 211, 153, 0.25)',
      }
    : {},
)

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
    <div
      v-for="o in tok.overlays"
      :key="o.key"
      :class="o.class"
      :style="o.style"
    />

    <template v-if="variant === 'cover'">
      <div
        class="flex h-full flex-col items-center justify-center text-center"
        :class="theme === 'dark' ? 'relative' : ''"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          :class="tok.avatarClass"
          width="236"
          height="236"
          :style="{
            width: `${coverAvatarPx}px`,
            height: `${coverAvatarPx}px`,
            marginBottom: `${coverGap1}px`,
          }"
        />
        <p :class="tok.coverTitleClass" :style="coverTitleStyle">
          {{ title }}
        </p>
        <p
          v-if="writtenYearLine?.trim()"
          :class="tok.coverWrittenClass"
          :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: '0.02em',
          }"
        >
          {{ writtenYearLine.trim() }}
        </p>
        <div
          :class="tok.coverDividerClass"
          :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }"
        />
        <p
          :class="tok.coverAuthorClass"
          :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }"
        >
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p
            v-if="authorNationality?.trim()"
            :class="tok.coverMetaNatClass"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: `${coverMetaGap}px`,
              letterSpacing: theme === 'neon' ? undefined : '0.02em',
            }"
          >
            {{ authorNationality.trim() }}
          </p>
          <p
            v-if="authorLifespan?.trim()"
            :class="tok.coverMetaLifeClass"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
            }"
          >
            {{ authorLifespan.trim() }}
          </p>
        </template>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div
        :class="[tok.bodyOuterClass, tok.bodyPad]"
        :style="{
          fontSize: `${bodyFontPx}px`,
          lineHeight: bodyLineHeight,
          gap: `${bodyGapPx}px`,
          ...bodyShadowStyle,
        }"
      >
        <p
          v-for="(line, i) in lines"
          :key="i"
          class="whitespace-pre-wrap"
          :class="tok.bodyInnerClass"
        >
          <CarouselVerseLine
            :line="line"
            :keywords="keywords"
            :mark-class="tok.verseMarkClass"
          />
        </p>
      </div>
    </template>

    <template v-else>
      <div
        class="flex h-full flex-col items-center justify-center text-center"
        :class="[
          theme === 'dark' || theme === 'gradient' ? 'relative' : '',
          tok.ctaPadClass,
        ]"
      >
        <CarouselSlideCta :cta-text="ctaText" :theme="tok.ctaTheme" />
      </div>
    </template>

    <CarouselSlideBrand :theme="tok.ctaTheme" />
  </div>
</template>
