import { z } from 'zod'
import { READER_FONT_STACKS } from '~/composables/useReaderPreferences'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'

/** Matches `READER_FONT_OPTIONS_ORDER` / `ReaderFontKey`. */
export const CAROUSEL_SITE_FONT_KEYS = [
  'georgia',
  'eb-garamond',
  'verdana',
  'roboto',
  'helvetica',
  'bookerly',
  'playfair',
  'literata',
  'lora',
  'merriweather',
  'crimson',
  'noto-serif',
  'source-serif',
  'inter',
] as const

export const carouselSiteDefaultsSchema = z.object({
  theme: z.enum(['minimal', 'dark', 'gradient', 'neon']),
  carouselFontKey: z.enum(CAROUSEL_SITE_FONT_KEYS),
  /** CSS `font-family` stack; optional on input — server fills from `carouselFontKey` before DB write. */
  carouselFontFamily: z.string().min(1).max(2000).optional(),
  linesPerSlide: z.number().int().min(4).max(16),
  bodyFontSizeScale: z.number().min(0.7).max(2),
  bodyLineHeight: z.number().min(1.15).max(2.25),
  /** Last-slide CTA; empty means client may show i18n default in preview. */
  ctaText: z.string().max(500),
  keywordInput: z.string().max(2000),
})

export type CarouselSiteDefaultsPayload = z.infer<typeof carouselSiteDefaultsSchema>

/** Hard defaults when DB is empty or JSON is invalid (aligned with carousel-generator.vue). */
function fontStackForCarouselKey(key: (typeof CAROUSEL_SITE_FONT_KEYS)[number]): string {
  return READER_FONT_STACKS[key as ReaderFontKey]
}

export function getDefaultCarouselSiteDefaults(): CarouselSiteDefaultsPayload {
  return {
    theme: 'dark',
    carouselFontKey: 'literata',
    carouselFontFamily: fontStackForCarouselKey('literata'),
    linesPerSlide: 8,
    bodyFontSizeScale: 1,
    bodyLineHeight: 1.65,
    ctaText: '',
    keywordInput: '',
  }
}

/**
 * Merge stored JSON with defaults so older rows (e.g. missing `carouselFontKey`) keep other fields.
 * Accepts legacy key `font` as an alias for `carouselFontKey`.
 */
export function parseCarouselSiteDefaults(raw: unknown): CarouselSiteDefaultsPayload {
  const base = getDefaultCarouselSiteDefaults()
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return base

  const o = { ...(raw as Record<string, unknown>) }
  if (o.carouselFontKey == null && typeof o.font === 'string') {
    o.carouselFontKey = o.font
  }

  const merged = { ...base, ...o }
  const full = carouselSiteDefaultsSchema.safeParse(merged)
  if (full.success) return ensureCarouselFontFamily(full.data)

  const shape = carouselSiteDefaultsSchema.shape
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    if (!(key in o)) continue
    const fieldSchema = shape[key]
    const r = fieldSchema.safeParse(o[key])
    if (r.success) {
      out[key as string] = r.data
    }
  }
  return ensureCarouselFontFamily(out as CarouselSiteDefaultsPayload)
}

/** Ensures `carouselFontFamily` CSS stack matches `carouselFontKey` (single source of truth for DB JSON). */
export function ensureCarouselFontFamily(p: CarouselSiteDefaultsPayload): CarouselSiteDefaultsPayload {
  const stack = fontStackForCarouselKey(p.carouselFontKey)
  return { ...p, carouselFontFamily: stack }
}
