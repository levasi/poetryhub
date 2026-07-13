import { beforeEach, describe, expect, it } from 'vitest'
import { createEvent } from 'h3'
import { useRuntimeConfig } from '#app'
import {
  signAdminToken,
  signUserToken,
  TOKEN_COOKIE,
  USER_TOKEN_COOKIE,
  verifyAdminToken,
  verifyUserToken,
} from '~/server/utils/auth'

describe('auth JWT helpers', () => {
  beforeEach(() => {
    useRuntimeConfig().jwtSecret = 'test-jwt-secret-for-unit-tests'
  })

  it('exports cookie names', () => {
    expect(TOKEN_COOKIE).toBe('ph_admin_token')
    expect(USER_TOKEN_COOKIE).toBe('ph_user_token')
  })

  it('signs and verifies admin token', async () => {
    const token = await signAdminToken({ id: 'a1', email: 'admin@test.com' })
    const payload = await verifyAdminToken(token)
    expect(payload).toMatchObject({ id: 'a1', email: 'admin@test.com', role: 'admin' })
  })

  it('signs and verifies user token with normalized role', async () => {
    const token = await signUserToken({
      id: 'u1',
      email: 'user@test.com',
      name: 'Test',
      role: 'editor',
    })
    const payload = await verifyUserToken(token)
    expect(payload).toMatchObject({ id: 'u1', email: 'user@test.com', role: 'editor' })
  })

  it('returns null for invalid token', async () => {
    expect(await verifyAdminToken('not-a-jwt')).toBeNull()
    expect(await verifyUserToken('not-a-jwt')).toBeNull()
  })

  it('requireAdmin throws without credentials', async () => {
    const { requireAdmin } = await import('~/server/utils/auth')
    const event = createEvent({ method: 'GET', url: '/api/admin' })
    event.node.req.headers = {}
    await expect(requireAdmin(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})
