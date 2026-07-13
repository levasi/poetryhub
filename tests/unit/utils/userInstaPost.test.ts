import { describe, expect, it } from 'vitest'
import { parseUserInstaPostPayload, userInstaPostBodySchema } from '~/utils/userInstaPost'

describe('userInstaPost', () => {
  const valid = {
    title: 'Luceafărul',
    authorName: 'Mihai Eminescu',
    poemText: 'A fost odată ca-n povești…',
    aspectRatioId: '3:4' as const,
    carouselFontKey: 'literata' as const,
    linesPerSlide: 8,
    bodyFontSizeScale: 1.5,
    bodyLineHeight: 1.65,
    theme: 'dark' as const,
    keywordInput: 'stea, noapte',
    ctaText: 'Visit poetryhub.ro',
  }

  it('parses a valid payload', () => {
    const parsed = parseUserInstaPostPayload(valid)
    expect(parsed).not.toBeNull()
    expect(parsed!.aspectRatioId).toBe('3:4')
    expect(parsed!.carouselFontFamily).toContain('Literata')
  })

  it('rejects missing poem text', () => {
    const parsed = userInstaPostBodySchema.safeParse({ ...valid, poemText: '' })
    expect(parsed.success).toBe(false)
  })
})
