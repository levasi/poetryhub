// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const requireAdmin = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/auth', () => ({ requireAdmin }))

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    requireAdmin.mockResolvedValue({
      id: 'a1',
      email: 'admin@test.com',
      role: 'admin',
    })
  })

  it('returns admin payload from requireAdmin', async () => {
    const res = await callHandler<{ email: string; role: string }>(
      '../../server/api/auth/me.get',
      buildGetEvent(),
    )
    expect(res).toEqual({ id: 'a1', email: 'admin@test.com', role: 'admin' })
  })
})
