// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'
import { callHandler, stubNitroGlobals } from '../helpers/nitro'

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
}))

const signUserToken = vi.hoisted(() => vi.fn().mockResolvedValue('signed-user-token'))

vi.mock('../../server/utils/prisma', () => ({ prisma: db }))
vi.mock('../../server/utils/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/auth')>()
  return { ...actual, signUserToken }
})
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed') },
}))
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, setCookie: vi.fn() }
})

describe('POST /api/user/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    signUserToken.mockResolvedValue('signed-user-token')
  })

  it('rejects invalid email', async () => {
    const event = createEvent({ method: 'POST', url: '/api/user/register' })
    await expect(
      callHandler('../../server/api/user/register.post', event, {
        email: 'not-email',
        password: 'secret12',
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects duplicate email', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'existing' })
    const event = createEvent({ method: 'POST', url: '/api/user/register' })
    await expect(
      callHandler('../../server/api/user/register.post', event, {
        email: 'user@test.com',
        password: 'secret12',
      }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates user and returns profile', async () => {
    db.user.findUnique.mockResolvedValue(null)
    db.user.create.mockResolvedValue({
      id: 'u-new',
      email: 'new@test.com',
      name: 'New User',
      role: 'user',
    })

    const event = createEvent({ method: 'POST', url: '/api/user/register' })
    const res = await callHandler<{ user: { email: string } }>(
      '../../server/api/user/register.post',
      event,
      { email: 'new@test.com', password: 'secret12', name: 'New User' },
    )

    expect(res.user.email).toBe('new@test.com')
    expect(signUserToken).toHaveBeenCalled()
  })
})
