<script setup lang="ts">
import type { CarouselTheme, SlideVariant } from '~/composables/useCarouselGenerator'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'
import CarouselInstaTemplate from './CarouselInstaTemplate.vue'

withDefaults(
  defineProps<{
    theme: CarouselTheme
    variant: SlideVariant
    title: string
    author: string
    /** Nationality / origin (or ethnicity), cover only. */
    authorNationality?: string
    /** Formatted years, e.g. `1850–1889`, cover only. */
    authorLifespan?: string
    /** Localized line, e.g. “Written in 1886”, cover only; empty to hide. */
    writtenYearLine?: string
    /** Author portrait on the cover slide (URL). */
    avatarUrl?: string
    lines?: string[]
    ctaText: string
    fontScaleBody: number
    titleScale: number
    keywords: string[]
    /** Multiplier on body verse font size (body slides only). */
    bodyFontSizeScale?: number
    /** Unitless CSS line-height for verse lines (body slides only). */
    bodyLineHeight?: number
    /** CSS `font-family` stack for all slide text (matches reader font options). */
    fontFamily?: string
    /** Verse slide weight override; null = theme default. */
    bodyFontWeight?: number | null
    /** Cover title weight override; null = theme default. */
    titleFontWeight?: number | null
  }>(),
  {
    authorNationality: '',
    authorLifespan: '',
    writtenYearLine: '',
    bodyFontSizeScale: 1,
    bodyLineHeight: 1.65,
    fontFamily: () => READER_FONT_STACKS.literata,
    bodyFontWeight: null,
    titleFontWeight: null,
  },
)
</script>

<template>
  <CarouselInstaTemplate :theme="theme" :variant="variant" :title="title" :author="author"
    :author-nationality="authorNationality" :author-lifespan="authorLifespan" :written-year-line="writtenYearLine"
    :avatar-url="avatarUrl" :lines="lines" :cta-text="ctaText" :font-scale-body="fontScaleBody"
    :title-scale="titleScale" :keywords="keywords" :body-font-size-scale="bodyFontSizeScale"
    :body-line-height="bodyLineHeight" :font-family="fontFamily" :body-font-weight="bodyFontWeight"
    :title-font-weight="titleFontWeight" />
</template>
