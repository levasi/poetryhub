// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  estimateReadingTime,
  extractExcerpt,
  slugify,
} from '~/server/utils/slug'

describe('slugify', () => {
  it('creates URL-safe slugs', () => {
    expect(slugify('Eminescu — Luceafărul')).toBe('eminescu-luceafrul')
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--test--')).toBe('test')
  })
})

describe('estimateReadingTime', () => {
  it('estimates seconds from word count', () => {
    const words = Array.from({ length: 200 }, () => 'word').join(' ')
    expect(estimateReadingTime(words)).toBeGreaterThan(0)
  })
})

describe('extractExcerpt', () => {
  it('returns first non-empty lines', () => {
    expect(excerptLines('a\n\nb\nc')).toBe('a\nb')
  })
})

function excerptLines(content: string) {
  return extractExcerpt(content, 2)
}
