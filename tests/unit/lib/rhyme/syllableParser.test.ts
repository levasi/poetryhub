// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  computeEndingKeys,
  endingLastSyllable,
  splitSyllables,
  syllableCount,
} from '~/lib/rhyme/syllableParser'

describe('splitSyllables', () => {
  it('splits Romanian words heuristically', () => {
    expect(splitSyllables('iubire')).toEqual(['iu', 'bi', 're'])
    expect(splitSyllables('mare')).toEqual(['ma', 're'])
  })

  it('returns empty for non-letter input', () => {
    expect(splitSyllables('---')).toEqual([])
  })
})

describe('syllableCount', () => {
  it('returns at least 1', () => {
    expect(syllableCount('a')).toBe(1)
    expect(syllableCount('mare')).toBe(2)
  })
})

describe('endingLastSyllable', () => {
  it('returns last syllable chunk', () => {
    expect(endingLastSyllable('iubire')).toBe('re')
  })
})

describe('computeEndingKeys', () => {
  it('produces folded ending keys', () => {
    const keys = computeEndingKeys('mare')
    expect(keys.endingLast).toBe('re')
    expect(keys.endingKey).toBe('mare')
  })
})
