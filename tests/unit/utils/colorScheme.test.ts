// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  isColorSchemeId,
} from '~/utils/colorScheme'

describe('colorScheme', () => {
  it('exposes known schemes and default', () => {
    expect(COLOR_SCHEMES).toContain('paper')
    expect(DEFAULT_COLOR_SCHEME).toBe('paper')
  })

  it('validates color scheme ids', () => {
    expect(isColorSchemeId('paper')).toBe(true)
    expect(isColorSchemeId('sepia')).toBe(true)
    expect(isColorSchemeId('invalid')).toBe(false)
  })
})
