// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildCarouselSlides,
  buildInstagramCaption,
  CAROUSEL_LINES_PER_BODY_SLIDE,
  formatAuthorLifespan,
  highlightSegments,
  slideFilename,
  splitPoemIntoSlides,
} from '~/composables/useCarouselGenerator'

describe('useCarouselGenerator (pure helpers)', () => {
  describe('formatAuthorLifespan', () => {
    it('formats birth–death, partial, or empty', () => {
      expect(formatAuthorLifespan(1850, 1889)).toBe('1850–1889')
      expect(formatAuthorLifespan(1850, null)).toBe('1850–')
      expect(formatAuthorLifespan(null, 1889)).toBe('?–1889')
      expect(formatAuthorLifespan(null, null)).toBe('')
    })
  })

  describe('splitPoemIntoSlides', () => {
    it('returns empty for blank poem', () => {
      expect(splitPoemIntoSlides('')).toEqual([])
      expect(splitPoemIntoSlides('   \n  ')).toEqual([])
    })

    it('keeps blank lines and packs up to max per slide', () => {
      const lines = ['a', '', 'b', 'c', 'd', 'e']
      const slides = splitPoemIntoSlides(lines.join('\n'), { maxLinesPerSlide: 4 })
      expect(slides.flat()).toEqual(lines)
      expect(slides.every((s) => s.length <= 4)).toBe(true)
    })

    it('rebalances 4+1 orphan into 3+2 when max is 4', () => {
      const poem = ['1', '2', '3', '4', '5'].join('\n')
      expect(splitPoemIntoSlides(poem, { maxLinesPerSlide: 4 })).toEqual([
        ['1', '2', '3'],
        ['4', '5'],
      ])
    })
  })

  describe('buildCarouselSlides', () => {
    it('wraps body with cover and cta slides', () => {
      const slides = buildCarouselSlides('line one\nline two')
      expect(slides[0]).toEqual({ kind: 'cover' })
      expect(slides[slides.length - 1]).toEqual({ kind: 'cta' })
      expect(slides.some((s) => s.kind === 'body')).toBe(true)
    })
  })

  describe('slideFilename', () => {
    it('slugifies title for filenames', () => {
      expect(slideFilename('Luceafărul', 0)).toBe('luceafarul-slide-1.png')
      expect(slideFilename('!!!', 2)).toBe('poem-slide-3.png')
    })
  })

  describe('buildInstagramCaption', () => {
    it('includes title, author, excerpt, and hashtags', () => {
      const caption = buildInstagramCaption('Titlu', 'Autor', 'Prima linie\nA doua')
      expect(caption).toContain('Titlu')
      expect(caption).toContain('— Autor')
      expect(caption).toContain('Prima linie')
      expect(caption).toContain('#poezie')
    })
  })

  describe('highlightSegments', () => {
    it('marks keyword matches case-insensitively', () => {
      const segs = highlightSegments('Soare blând', ['soare'])
      expect(segs.some((s) => s.mark && s.text.toLowerCase() === 'soare')).toBe(true)
    })

    it('returns whole line unmarked when no keywords', () => {
      expect(highlightSegments('text', [])).toEqual([{ text: 'text', mark: false }])
    })
  })

  it('exports default lines per body slide', () => {
    expect(CAROUSEL_LINES_PER_BODY_SLIDE).toBe(8)
  })
})
