// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const prisma = {
  siteSettings: { findUnique: vi.fn() },
}

vi.mock('../../server/utils/prisma', () => ({ prisma }))

describe('GET /api/site/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
  })

  it('returns showLanguageSwitch from DB', async () => {
    prisma.siteSettings.findUnique.mockResolvedValue({ showLanguageSwitch: true })
    const res = await callHandler<{ showLanguageSwitch: boolean }>(
      '../../server/api/site/settings.get',
      buildGetEvent(),
    )
    expect(res).toEqual({ showLanguageSwitch: true })
  })

  it('defaults showLanguageSwitch to false when row missing', async () => {
    prisma.siteSettings.findUnique.mockResolvedValue(null)
    const res = await callHandler<{ showLanguageSwitch: boolean }>(
      '../../server/api/site/settings.get',
      buildGetEvent(),
    )
    expect(res).toEqual({ showLanguageSwitch: false })
  })
})
