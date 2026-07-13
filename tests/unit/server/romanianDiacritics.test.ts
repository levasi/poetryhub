// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { officialRomanianDiacritics } from '~/server/utils/romanianDiacritics'

describe('officialRomanianDiacritics', () => {
  it('normalizes legacy ş/ţ to ș/ț', () => {
    expect(officialRomanianDiacritics('şcoală')).toBe('școală')
    expect(officialRomanianDiacritics('naţiune')).toBe('națiune')
  })

  it('returns empty input unchanged', () => {
    expect(officialRomanianDiacritics('')).toBe('')
  })
})
