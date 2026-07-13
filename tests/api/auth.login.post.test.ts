// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'
import { callHandler, stubNitroGlobals } from '../helpers/nitro'

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  adminUser: { findUnique: vi.fn() },
}))

const signAdminToken = vi.hoisted(() => vi.fn().mockResolvedValue('signed-admin-token'))

vi.mock('../../server/utils/prisma', () => ({ prisma: db }))
vi.mock('../../server/utils/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/auth')>()
  return { ...actual, signAdminToken }
})
vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}))
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, setCookie: vi.fn() }
})

import bcrypt from 'bcryptjs'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    signAdminToken.mockResolvedValue('signed-admin-token')
  })

  it('rejects invalid body', async () => {
    const event = createEvent({ method: 'POST', url: '/api/auth/login' })
    await expect(
      callHandler('../../server/api/auth/login.post', event, { email: 'bad', password: 'x' }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('logs in admin user and sets cookie', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      passwordHash: 'hash',
    })
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const event = createEvent({ method: 'POST', url: '/api/auth/login' })
    const res = await callHandler<{ ok: boolean; user: { role: string } }>(
      '../../server/api/auth/login.post',
      event,
      { email: 'admin@test.com', password: 'secret12' },
    )

    expect(res.ok).toBe(true)
    expect(res.user.role).toBe('admin')
    expect(signAdminToken).toHaveBeenCalled()
  })

  it('rejects non-admin user credentials', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      role: 'user',
      passwordHash: 'hash',
    })
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    db.adminUser.findUnique.mockResolvedValue(null)

    const event = createEvent({ method: 'POST', url: '/api/auth/login' })
    await expect(
      callHandler('../../server/api/auth/login.post', event, {
        email: 'user@test.com',
        password: 'secret12',
      }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})
