// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  ensureCarouselFontFamily,
  getDefaultCarouselSiteDefaults,
  parseCarouselSiteDefaults,
} from '~/utils/carouselSiteDefaults'

describe('carouselSiteDefaults', () => {
  it('returns hard defaults', () => {
    const d = getDefaultCarouselSiteDefaults()
    expect(d.theme).toBe('dark')
    expect(d.carouselFontKey).toBe('literata')
    expect(d.linesPerSlide).toBe(8)
    expect(d.carouselFontFamily).toContain('Literata')
  })

  it('parses valid stored config', () => {
    const parsed = parseCarouselSiteDefaults({
      theme: 'minimal',
      carouselFontKey: 'georgia',
      linesPerSlide: 6,
      bodyFontSizeScale: 1.2,
      bodyLineHeight: 1.5,
      ctaText: 'Follow us',
      keywordInput: 'soare',
    })
    expect(parsed.theme).toBe('minimal')
    expect(parsed.carouselFontFamily).toContain('Georgia')
  })

  it('migrates legacy font key and Romanian CTA', () => {
    const parsed = parseCarouselSiteDefaults({
      font: 'playfair',
      theme: 'dark',
      carouselFontKey: 'playfair',
      linesPerSlide: 8,
      bodyFontSizeScale: 1.5,
      bodyLineHeight: 1.65,
      ctaText: 'Urmărește pentru mai multă poezie',
      keywordInput: '',
    })
    expect(parsed.carouselFontKey).toBe('playfair')
    expect(parsed.ctaText).toBe('')
  })

  it('returns defaults for invalid input', () => {
    expect(parseCarouselSiteDefaults(null).theme).toBe('dark')
    expect(parseCarouselSiteDefaults('bad').theme).toBe('dark')
  })

  it('fills font family from key', () => {
    const base = getDefaultCarouselSiteDefaults()
    const withFont = ensureCarouselFontFamily({ ...base, carouselFontKey: 'eb-garamond' })
    expect(withFont.carouselFontFamily).toContain('EB Garamond')
  })
})
