// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const prisma = {
  carouselSiteDefaults: { findUnique: vi.fn() },
}

vi.mock('../../server/utils/prisma', () => ({ prisma }))

describe('GET /api/carousel/defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
  })

  it('returns parsed config from DB', async () => {
    prisma.carouselSiteDefaults.findUnique.mockResolvedValue({
      config: {
        theme: 'minimal',
        carouselFontKey: 'georgia',
        linesPerSlide: 8,
        bodyFontSizeScale: 1.5,
        bodyLineHeight: 1.65,
        ctaText: '',
        keywordInput: '',
      },
    })
    const res = await callHandler<{ theme: string; carouselFontKey: string }>(
      '../../server/api/carousel/defaults.get',
      buildGetEvent(),
    )
    expect(res.theme).toBe('minimal')
    expect(res.carouselFontKey).toBe('georgia')
  })

  it('returns hard defaults when DB row missing', async () => {
    prisma.carouselSiteDefaults.findUnique.mockResolvedValue(null)
    const res = await callHandler<{ theme: string }>(
      '../../server/api/carousel/defaults.get',
      buildGetEvent(),
    )
    expect(res.theme).toBe('dark')
  })
})
