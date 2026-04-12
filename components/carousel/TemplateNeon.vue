<script setup lang="ts">
import type { SlideVariant } from '~/composables/useCarouselGenerator'
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

const coverTitlePx = computed(() => Math.round(66 * props.titleScale))
const coverAuthorPx = computed(() => goldenSecondaryPxFromTitle(coverTitlePx.value))
const coverAvatarPx = computed(() => coverAvatarDiameterPxFromTitle(coverTitlePx.value))
const coverGap1 = computed(() => coverGoldenSpacingPx(props.titleScale, 1))
const coverGap2 = computed(() => coverGoldenSpacingPx(props.titleScale, 2))
const coverDividerW = computed(() => Math.round(128 * PHI))
const coverBadgePx = computed(() => Math.round(14 * props.titleScale))
const coverMetaPx = computed(() => Math.max(13, goldenSecondaryPxFromTitle(coverAuthorPx.value)))
const coverMetaGap = computed(() => coverGoldenSpacingPx(props.titleScale, 0))
const coverMetaBetween = computed(() => Math.round(coverMetaGap.value * 0.45))
const hasAuthorMeta = computed(
  () => !!(props.authorNationality?.trim() || props.authorLifespan?.trim()),
)
</script>

<template>
  <div
    class="carousel-canvas template-neon relative flex flex-col overflow-hidden antialiased"
    :style="{
      width: `${CAROUSEL_WIDTH}px`,
      height: `${CAROUSEL_HEIGHT}px`,
      padding: '56px',
      boxSizing: 'border-box',
      background: '#030712',
      fontFamily,
    }"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="background-image: linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.06) 1px, transparent 1px); background-size: 48px 48px;"
    />

    <template v-if="variant === 'cover'">
      <div class="relative flex h-full flex-col items-center justify-center text-center">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          class="rounded-full object-cover ring-4 ring-emerald-400/50 shadow-[0_0_40px_rgba(52,211,153,0.35)]"
          width="232"
          height="232"
          :style="{
            width: `${coverAvatarPx}px`,
            height: `${coverAvatarPx}px`,
            marginBottom: `${coverGap1}px`,
          }"
        />
        <p
          class="font-black uppercase tracking-tight text-emerald-300"
          :style="{
            fontSize: `${coverTitlePx}px`,
            maxWidth: '940px',
            textShadow: '0 0 40px rgba(52, 211, 153, 0.45), 0 0 80px rgba(16, 185, 129, 0.2)',
          }"
        >
          {{ title }}
        </p>
        <p
          v-if="writtenYearLine?.trim()"
          class="tabular-nums text-emerald-200/75"
          :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: '0.02em',
          }"
        >
          {{ writtenYearLine.trim() }}
        </p>
        <div
          class="h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
          :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }"
        />
        <p
          class="font-semibold tracking-[0.2em] text-cyan-200/90"
          :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }"
        >
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p
            v-if="authorNationality?.trim()"
            class="tracking-wide text-emerald-200/75"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: `${coverMetaGap}px`,
            }"
          >
            {{ authorNationality.trim() }}
          </p>
          <p
            v-if="authorLifespan?.trim()"
            class="tabular-nums text-emerald-200/75"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
            }"
          >
            {{ authorLifespan.trim() }}
          </p>
        </template>
        <p
          class="rounded border border-emerald-500/40 bg-emerald-950/50 px-6 py-2.5 uppercase tracking-[0.5em] text-emerald-400/90"
          :style="{ fontSize: `${coverBadgePx}px`, marginTop: `${coverGap2}px` }"
        >
          viral / share
        </p>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div
        class="relative flex h-full flex-col justify-center px-5 text-center font-semibold text-emerald-100/95"
        :style="{
          fontSize: `${Math.round(34 * fontScaleBody * bodyFontSizeScale)}px`,
          lineHeight: bodyLineHeight,
          gap: `${Math.round(34 * fontScaleBody * bodyFontSizeScale * Math.max(0, bodyLineHeight - 1) * 0.5)}px`,
          textShadow: '0 0 24px rgba(52, 211, 153, 0.25)',
        }"
      >
        <p v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap">
          <CarouselVerseLine :line="line" :keywords="keywords" mark-class="bg-fuchsia-600/50 text-white px-1 rounded" />
        </p>
      </div>
    </template>

    <template v-else>
      <div class="relative flex h-full flex-col items-center justify-center px-8 text-center">
        <CarouselSlideCta :cta-text="ctaText" theme="neon" />
      </div>
    </template>

    <CarouselSlideBrand theme="neon" />
  </div>
</template>
