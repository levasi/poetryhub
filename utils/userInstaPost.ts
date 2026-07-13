import { z } from 'zod'
import { poemCarouselSettingsSchema, ensurePoemCarouselFontFamily } from '~/utils/poemCarouselFontSettings'

export const USER_INSTA_POST_ASPECT_RATIO_IDS = ['3:4', '4:5', '1:1'] as const

/** Body for create/update — full Insta post state saved to the user account. */
export const userInstaPostBodySchema = poemCarouselSettingsSchema.extend({
  title: z.string().min(1).max(500).trim(),
  authorName: z.string().min(1).max(200).trim(),
  poemText: z.string().min(1).max(50_000).trim(),
  poemSlug: z.string().max(200).trim().nullable().optional(),
  aspectRatioId: z.enum(USER_INSTA_POST_ASPECT_RATIO_IDS),
  ctaText: z.string().max(2000).trim().optional(),
  poemWrittenYear: z.string().max(220).trim().nullable().optional(),
  authorNationality: z.string().max(200).trim().nullable().optional(),
  authorBirthYear: z.string().max(20).trim().nullable().optional(),
  authorDeathYear: z.string().max(20).trim().nullable().optional(),
})

export type UserInstaPostPayload = z.infer<typeof userInstaPostBodySchema>

export function normalizeUserInstaPostPayload(raw: UserInstaPostPayload): UserInstaPostPayload {
  const carousel = ensurePoemCarouselFontFamily({
    theme: raw.theme,
    carouselFontKey: raw.carouselFontKey,
    carouselFontFamily: raw.carouselFontFamily,
    linesPerSlide: raw.linesPerSlide,
    bodyFontSizeScale: raw.bodyFontSizeScale,
    bodyLineHeight: raw.bodyLineHeight,
    bodyFontWeight: raw.bodyFontWeight,
    titleFontWeight: raw.titleFontWeight,
    keywordInput: raw.keywordInput,
  })
  return {
    ...raw,
    ...carousel,
    poemSlug: raw.poemSlug?.trim() || null,
    poemWrittenYear: raw.poemWrittenYear?.trim() || null,
    authorNationality: raw.authorNationality?.trim() || null,
    authorBirthYear: raw.authorBirthYear?.trim() || null,
    authorDeathYear: raw.authorDeathYear?.trim() || null,
    ctaText: raw.ctaText?.trim() || undefined,
  }
}

export function parseUserInstaPostPayload(raw: unknown): UserInstaPostPayload | null {
  const parsed = userInstaPostBodySchema.safeParse(raw)
  if (!parsed.success) return null
  return normalizeUserInstaPostPayload(parsed.data)
}
