import { z } from 'zod'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import { CAROUSEL_SITE_FONT_KEYS } from '~/utils/carouselSiteDefaults'

/** Stored on `Poem.carouselFontSettings` — carousel generator state for this poem only. */
export const poemCarouselSettingsSchema = z.object({
  theme: z
    .enum([
      'minimal',
      'dark',
      'gradient',
      'neon',
      'parchment',
      'ocean',
      'sunset',
      'editorial',
      'forest',
      'cosmos',
    ])
    .optional(),
  carouselFontKey: z.enum(CAROUSEL_SITE_FONT_KEYS),
  carouselFontFamily: z.string().min(1).max(2000).optional(),
  linesPerSlide: z.number().int().min(4).max(16),
  bodyFontSizeScale: z.number().min(0.7).max(2),
  bodyLineHeight: z.number().min(1.15).max(2.25),
  /** Override verse weight; omit or null = keep theme defaults. */
  bodyFontWeight: z.number().int().min(100).max(900).nullable().optional(),
  /** Override cover title weight; omit or null = keep theme defaults. */
  titleFontWeight: z.number().int().min(100).max(900).nullable().optional(),
  keywordInput: z.string().max(2000).optional(),
})

export type PoemCarouselSettingsPayload = z.infer<typeof poemCarouselSettingsSchema>

function fontStackForKey(key: (typeof CAROUSEL_SITE_FONT_KEYS)[number]): string {
  return READER_FONT_STACKS[key as ReaderFontKey]
}

export function ensurePoemCarouselFontFamily(p: PoemCarouselSettingsPayload): PoemCarouselSettingsPayload {
  return { ...p, carouselFontFamily: fontStackForKey(p.carouselFontKey) }
}

/** Returns null if missing or invalid. Older rows may omit theme/CTA/keywords — those stay optional. */
export function parsePoemCarouselSettings(raw: unknown): PoemCarouselSettingsPayload | null {
  if (raw === null || raw === undefined) return null
  const parsed = poemCarouselSettingsSchema.safeParse(raw)
  if (!parsed.success) return null
  return ensurePoemCarouselFontFamily(parsed.data)
}
