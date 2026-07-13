// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CAROUSEL_FONT_WEIGHT_PRESETS } from '~/utils/carouselFontWeights'

describe('carouselFontWeights', () => {
  it('exposes standard CSS weight presets', () => {
    expect(CAROUSEL_FONT_WEIGHT_PRESETS).toEqual([300, 400, 500, 600, 700])
  })
})
