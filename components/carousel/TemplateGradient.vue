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

const coverTitlePx = computed(() => Math.round(68 * props.titleScale))
const coverAuthorPx = computed(() => goldenSecondaryPxFromTitle(coverTitlePx.value))
const coverAvatarPx = computed(() => coverAvatarDiameterPxFromTitle(coverTitlePx.value))
const coverGap1 = computed(() => coverGoldenSpacingPx(props.titleScale, 1))
const coverGap2 = computed(() => coverGoldenSpacingPx(props.titleScale, 2))
const coverDividerW = computed(() => Math.round(140 * PHI))
const coverBadgePx = computed(() => Math.round(15 * props.titleScale))
const coverMetaPx = computed(() => Math.max(13, goldenSecondaryPxFromTitle(coverAuthorPx.value)))
const coverMetaGap = computed(() => coverGoldenSpacingPx(props.titleScale, 0))
const coverMetaBetween = computed(() => Math.round(coverMetaGap.value * 0.45))
const hasAuthorMeta = computed(
  () => !!(props.authorNationality?.trim() || props.authorLifespan?.trim()),
)
</script>

<template>
  <div
    class="carousel-canvas template-gradient relative flex flex-col overflow-hidden text-white antialiased"
    :style="{
      width: `${CAROUSEL_WIDTH}px`,
      height: `${CAROUSEL_HEIGHT}px`,
      padding: '56px',
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #5b21b6 100%)',
      fontFamily,
    }"
  >
    <div
      class="pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full bg-violet-400/20 blur-3xl"
    />
    <div
      class="pointer-events-none absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl"
    />

    <template v-if="variant === 'cover'">
      <div class="relative flex h-full flex-col items-center justify-center text-center">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          class="rounded-full object-cover shadow-xl ring-4 ring-white/40"
          width="236"
          height="236"
          :style="{
            width: `${coverAvatarPx}px`,
            height: `${coverAvatarPx}px`,
            marginBottom: `${coverGap1}px`,
          }"
        />
        <p
          class="font-bold leading-[1.1] drop-shadow-md"
          :style="{ fontSize: `${coverTitlePx}px`, maxWidth: '920px' }"
        >
          {{ title }}
        </p>
        <p
          v-if="writtenYearLine?.trim()"
          class="tabular-nums text-white/70"
          :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: '0.02em',
          }"
        >
          {{ writtenYearLine.trim() }}
        </p>
        <div
          class="h-1 rounded-full bg-white/35"
          :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }"
        />
        <p
          class="font-medium text-white/85"
          :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }"
        >
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p
            v-if="authorNationality?.trim()"
            class="text-white/70"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: `${coverMetaGap}px`,
              letterSpacing: '0.02em',
            }"
          >
            {{ authorNationality.trim() }}
          </p>
          <p
            v-if="authorLifespan?.trim()"
            class="tabular-nums text-white/70"
            :style="{
              fontSize: `${coverMetaPx}px`,
              marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
            }"
          >
            {{ authorLifespan.trim() }}
          </p>
        </template>
        <p
          class="rounded-full border border-white/20 bg-white/10 px-7 py-2.5 uppercase tracking-[0.35em] text-white/75"
          :style="{ fontSize: `${coverBadgePx}px`, marginTop: `${coverGap2}px` }"
        >
          Modern verse
        </p>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div
        class="relative flex h-full flex-col justify-center px-6 text-center text-white/95"
        :style="{
          fontSize: `${Math.round(37 * fontScaleBody * bodyFontSizeScale)}px`,
          lineHeight: bodyLineHeight,
          gap: `${Math.round(37 * fontScaleBody * bodyFontSizeScale * Math.max(0, bodyLineHeight - 1) * 0.5)}px`,
        }"
      >
        <p v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap drop-shadow-sm">
          <CarouselVerseLine :line="line" :keywords="keywords" mark-class="rounded bg-white/20 px-1 text-white" />
        </p>
      </div>
    </template>

    <template v-else>
      <div class="relative flex h-full flex-col items-center justify-center px-10 text-center">
        <CarouselSlideCta :cta-text="ctaText" theme="gradient" />
      </div>
    </template>

    <CarouselSlideBrand theme="gradient" />
  </div>
</template>
