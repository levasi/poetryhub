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

const coverTitlePx = computed(() => Math.round(72 * props.titleScale))
const coverAuthorPx = computed(() => goldenSecondaryPxFromTitle(coverTitlePx.value))
const coverAvatarPx = computed(() => coverAvatarDiameterPxFromTitle(coverTitlePx.value))
const coverGap1 = computed(() => coverGoldenSpacingPx(props.titleScale, 1))
const coverGap2 = computed(() => coverGoldenSpacingPx(props.titleScale, 2))
const coverDividerW = computed(() => Math.round(136 * PHI))
const coverTagPx = computed(() => Math.round(14 * props.titleScale))
const coverMetaPx = computed(() => Math.max(13, goldenSecondaryPxFromTitle(coverAuthorPx.value)))
const coverMetaGap = computed(() => coverGoldenSpacingPx(props.titleScale, 0))
const coverMetaBetween = computed(() => Math.round(coverMetaGap.value * 0.45))
const hasAuthorMeta = computed(
  () => !!(props.authorNationality?.trim() || props.authorLifespan?.trim()),
)
</script>

<template>
  <div class="carousel-canvas template-dark relative flex flex-col overflow-hidden antialiased" :style="{
    width: `${CAROUSEL_WIDTH}px`,
    height: `${CAROUSEL_HEIGHT}px`,
    padding: '56px',
    boxSizing: 'border-box',
    background: 'linear-gradient(165deg, #0a0a0c 0%, #14141a 45%, #0c0c0e 100%)',
    fontFamily,
  }">
    <div class="pointer-events-none absolute inset-0 opacity-[0.07]"
      style="background-image: radial-gradient(circle at 20% 30%, #e8a800 0%, transparent 45%), radial-gradient(circle at 80% 70%, #f5f5f0 0%, transparent 40%);" />

    <template v-if="variant === 'cover'">
      <div class="relative flex h-full flex-col items-center justify-center text-center">
        <img v-if="avatarUrl" :src="avatarUrl" alt=""
          class="rounded-full object-cover shadow-xl ring-4 ring-gold-500/35" width="240" height="240" :style="{
            width: `${coverAvatarPx}px`,
            height: `${coverAvatarPx}px`,
            marginBottom: `${coverGap1}px`,
          }" />
        <p class="font-semibold leading-[1.12] text-ink-50"
          :style="{ fontSize: `${coverTitlePx}px`, maxWidth: '920px' }">
          {{ title }}
        </p>
        <p v-if="writtenYearLine?.trim()" class="tabular-nums text-ink-400" :style="{
          fontSize: `${coverMetaPx}px`,
          marginTop: `${coverMetaGap}px`,
          letterSpacing: '0.02em',
        }">
          {{ writtenYearLine.trim() }}
        </p>
        <div class="h-px bg-gradient-to-r from-transparent via-gold-500/80 to-transparent"
          :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }" />
        <p class="font-medium tracking-wide text-ink-300"
          :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }">
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p v-if="authorNationality?.trim()" class="text-ink-400" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: '0.02em',
          }">
            {{ authorNationality.trim() }}
          </p>
          <p v-if="authorLifespan?.trim()" class="tabular-nums text-ink-400" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
          }">
            {{ authorLifespan.trim() }}
          </p>
        </template>
        <p class="uppercase tracking-[0.4em] text-ink-500"
          :style="{ fontSize: `${coverTagPx}px`, marginTop: `${coverGap2}px` }">
          — poezie —
        </p>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div class="relative flex h-full flex-col justify-center px-4 text-center text-ink-100" :style="{
        fontSize: `${Math.round(38 * fontScaleBody * bodyFontSizeScale)}px`,
        lineHeight: bodyLineHeight,
        gap: `${Math.round(38 * fontScaleBody * bodyFontSizeScale * Math.max(0, bodyLineHeight - 1) * 0.5)}px`,
      }">
        <p v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap text-balance">
          <CarouselVerseLine :line="line" :keywords="keywords" mark-class="bg-gold-500/25 text-gold-300" />
        </p>
      </div>
    </template>

    <template v-else>
      <div class="relative flex h-full flex-col items-center justify-center px-10 text-center">
        <CarouselSlideCta :cta-text="ctaText" theme="dark" />
      </div>
    </template>

    <CarouselSlideBrand theme="dark" />
  </div>
</template>
