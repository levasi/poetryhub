// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { displayNationality } from '~/utils/nationality'

describe('displayNationality', () => {
  it('returns null for empty input', () => {
    expect(displayNationality(null)).toBeNull()
    expect(displayNationality('')).toBeNull()
    expect(displayNationality('   ')).toBeNull()
  })

  it('normalizes Romanian variants', () => {
    expect(displayNationality('Romanian')).toBe('Român')
    expect(displayNationality('romania')).toBe('Român')
    expect(displayNationality('română')).toBe('Român')
    expect(displayNationality('român')).toBe('Român')
  })

  it('returns trimmed raw value for other nationalities', () => {
    expect(displayNationality('  French  ')).toBe('French')
  })
})
