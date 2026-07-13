// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePoemCarouselSettings } from '~/utils/poemCarouselFontSettings'

describe('parsePoemCarouselSettings', () => {
  const valid = {
    carouselFontKey: 'georgia',
    linesPerSlide: 8,
    bodyFontSizeScale: 1,
    bodyLineHeight: 1.5,
  }

  it('parses valid payload and fills font family', () => {
    const parsed = parsePoemCarouselSettings(valid)
    expect(parsed).not.toBeNull()
    expect(parsed!.carouselFontKey).toBe('georgia')
    expect(parsed!.carouselFontFamily).toContain('Georgia')
  })

  it('returns null for missing or invalid data', () => {
    expect(parsePoemCarouselSettings(null)).toBeNull()
    expect(parsePoemCarouselSettings({ carouselFontKey: 'georgia' })).toBeNull()
    expect(parsePoemCarouselSettings({ ...valid, linesPerSlide: 99 })).toBeNull()
  })
})
