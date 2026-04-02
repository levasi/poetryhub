// JWT auth utilities for admin panel and user accounts
import { SignJWT, jwtVerify } from 'jose'
import { H3Event, getCookie } from 'h3'

const TOKEN_COOKIE = 'ph_admin_token'
const USER_TOKEN_COOKIE = 'ph_user_token'
const TOKEN_EXPIRY = '7d'

function getSecret() {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.jwtSecret)
}

// ─── Admin token ─────────────────────────────────────────────────────────────

export async function signAdminToken(payload: { id: string; email: string }) {
  return new SignJWT({ ...payload, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret())
}

export async function verifyAdminToken(
  token: string,
): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function requireAdmin(event: H3Event) {
  const token =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')

  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const payload = await verifyAdminToken(token)
  if (!payload || payload.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return payload
}

// ─── User token ──────────────────────────────────────────────────────────────

export async function signUserToken(payload: {
  id: string
  email: string
  name?: string | null
  role: 'user' | 'admin'
}) {
  return new SignJWT({ ...payload, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret())
}

export async function verifyUserToken(
  token: string,
): Promise<{ id: string; email: string; name?: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const p = payload as { id: string; email: string; name?: string; role?: string }
    return { ...p, role: p.role === 'admin' ? 'admin' : 'user' }
  } catch {
    return null
  }
}

export async function getUserFromEvent(
  event: H3Event,
): Promise<{ id: string; email: string; name?: string; role: string } | null> {
  const token = getCookie(event, USER_TOKEN_COOKIE)
  if (!token) return null
  return verifyUserToken(token)
}

export async function requireUser(event: H3Event) {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user
}

// ─── Cookie names ────────────────────────────────────────────────────────────

export { TOKEN_COOKIE, USER_TOKEN_COOKIE }
