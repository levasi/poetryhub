// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { foldDiacritics, normalizeWord, normForSearch } from '~/lib/rhyme/normalize'

describe('normalizeWord', () => {
  it('trims and lowercases', () => {
    expect(normalizeWord('  MARE  ')).toBe('mare')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeWord('bun   ziua')).toBe('bun ziua')
  })
})

describe('foldDiacritics', () => {
  it('folds Romanian diacritics', () => {
    expect(foldDiacritics('măr')).toBe('mar')
    expect(foldDiacritics('școală')).toBe('scoala')
  })
})

describe('normForSearch', () => {
  it('keeps diacritics when strict', () => {
    expect(normForSearch('Măr', true)).toBe('măr')
    expect(normForSearch('mar', true)).toBe('mar')
  })

  it('folds diacritics when not strict', () => {
    expect(normForSearch('Măr', false)).toBe('mar')
  })
})
