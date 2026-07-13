// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  canSearch,
  letterCount,
  searchableTerms,
} from '~/utils/writeSearch'

describe('writeSearch', () => {
  it('counts Unicode letters', () => {
    expect(letterCount('a')).toBe(1)
    expect(letterCount('ăb')).toBe(2)
    expect(letterCount('a1')).toBe(1)
  })

  it('requires at least two letters to search', () => {
    const rows = [{ text: 'a' }, { text: 'ab' }]
    expect(searchableTerms(rows)).toEqual(['ab'])
    expect(canSearch(rows)).toBe(true)
    expect(canSearch([{ text: 'x' }])).toBe(false)
  })

  it('trims terms', () => {
    expect(searchableTerms([{ text: '  ma  ' }])).toEqual(['ma'])
  })
})
