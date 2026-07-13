// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseStrictPoemWrittenYear } from '~/utils/carouselWrittenIn'

describe('parseStrictPoemWrittenYear', () => {
  it('accepts valid catalog years', () => {
    expect(parseStrictPoemWrittenYear('1889')).toBe(1889)
    expect(parseStrictPoemWrittenYear('  42  ')).toBe(42)
  })

  it('rejects phrases and partial numbers', () => {
    expect(parseStrictPoemWrittenYear('9 aprilie 19')).toBeNull()
    expect(parseStrictPoemWrittenYear('circa 1889')).toBeNull()
    expect(parseStrictPoemWrittenYear('')).toBeNull()
  })

  it('rejects out-of-range years', () => {
    expect(parseStrictPoemWrittenYear('0')).toBeNull()
    expect(parseStrictPoemWrittenYear('3001')).toBeNull()
  })
})
