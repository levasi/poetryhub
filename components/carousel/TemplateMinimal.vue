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

/** Cover: larger type + golden-ratio spacing and title/author scale. */
const coverTitlePx = computed(() => Math.round(68 * props.titleScale))
const coverAuthorPx = computed(() => goldenSecondaryPxFromTitle(coverTitlePx.value))
const coverAvatarPx = computed(() => coverAvatarDiameterPxFromTitle(coverTitlePx.value))
const coverGap1 = computed(() => coverGoldenSpacingPx(props.titleScale, 1))
const coverGap2 = computed(() => coverGoldenSpacingPx(props.titleScale, 2))
const coverDividerW = computed(() => Math.round(132 * PHI))
const coverTagPx = computed(() => Math.round(17 * props.titleScale))
const coverMetaPx = computed(() => Math.max(13, goldenSecondaryPxFromTitle(coverAuthorPx.value)))
const coverMetaGap = computed(() => coverGoldenSpacingPx(props.titleScale, 0))
const coverMetaBetween = computed(() => Math.round(coverMetaGap.value * 0.45))
const hasAuthorMeta = computed(
  () => !!(props.authorNationality?.trim() || props.authorLifespan?.trim()),
)
</script>

<template>
  <div class="carousel-canvas template-minimal relative flex flex-col overflow-hidden bg-white text-ink-900 antialiased"
    :style="{
      width: `${CAROUSEL_WIDTH}px`,
      height: `${CAROUSEL_HEIGHT}px`,
      padding: '56px',
      boxSizing: 'border-box',
      fontFamily,
    }">
    <template v-if="variant === 'cover'">
      <div class="flex h-full flex-col items-center justify-center text-center">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" class="rounded-full object-cover shadow-lg ring-4 ring-ink-200/90"
          width="236" height="236" :style="{
            width: `${coverAvatarPx}px`,
            height: `${coverAvatarPx}px`,
            marginBottom: `${coverGap1}px`,
          }" />
        <p class="font-semibold leading-[1.12] text-ink-900"
          :style="{ fontSize: `${coverTitlePx}px`, maxWidth: '920px' }">
          {{ title }}
        </p>
        <p v-if="writtenYearLine?.trim()" class="tabular-nums text-ink-500" :style="{
          fontSize: `${coverMetaPx}px`,
          marginTop: `${coverMetaGap}px`,
          letterSpacing: '0.02em',
        }">
          {{ writtenYearLine.trim() }}
        </p>
        <div class="h-px bg-ink-300" :style="{ marginTop: `${coverGap1}px`, width: `${coverDividerW}px` }" />
        <p class="font-medium tracking-wide text-ink-600"
          :style="{ fontSize: `${coverAuthorPx}px`, marginTop: `${coverGap1}px` }">
          {{ author }}
        </p>
        <template v-if="hasAuthorMeta">
          <p v-if="authorNationality?.trim()" class="text-ink-500" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: `${coverMetaGap}px`,
            letterSpacing: '0.02em',
          }">
            {{ authorNationality.trim() }}
          </p>
          <p v-if="authorLifespan?.trim()" class="tabular-nums text-ink-500" :style="{
            fontSize: `${coverMetaPx}px`,
            marginTop: authorNationality?.trim() ? `${coverMetaBetween}px` : `${coverMetaGap}px`,
          }">
            {{ authorLifespan.trim() }}
          </p>
        </template>
      </div>
    </template>

    <template v-else-if="variant === 'body'">
      <div class="flex h-full flex-col justify-center px-2 text-center text-ink-800" :style="{
        fontSize: `${Math.round(40 * fontScaleBody * bodyFontSizeScale)}px`,
        lineHeight: bodyLineHeight,
        gap: `${Math.round(40 * fontScaleBody * bodyFontSizeScale * Math.max(0, bodyLineHeight - 1) * 0.5)}px`,
      }">
        <p v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap">
          <CarouselVerseLine :line="line" :keywords="keywords" mark-class="bg-gold-200/80 text-ink-900" />
        </p>
      </div>
    </template>

    <template v-else>
      <div class="flex h-full flex-col items-center justify-center px-8 text-center">
        <CarouselSlideCta :cta-text="ctaText" theme="minimal" />
      </div>
    </template>

    <CarouselSlideBrand theme="minimal" />
  </div>
</template>
