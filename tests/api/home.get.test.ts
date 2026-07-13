// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const getHomePagePayload = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/homePagePayload', () => ({ getHomePagePayload }))

describe('GET /api/home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    getHomePagePayload.mockResolvedValue({
      featured: [],
      recent: [],
      moodTags: [],
      themeTags: [],
    })
  })

  it('returns aggregated homepage payload', async () => {
    const res = await callHandler<{ featured: unknown[] }>(
      '../../server/api/home.get',
      buildGetEvent(),
    )
    expect(res.featured).toEqual([])
    expect(getHomePagePayload).toHaveBeenCalled()
  })
})
