// JWT auth utilities for admin panel and user accounts
import { SignJWT, jwtVerify } from 'jose'
import { H3Event, getCookie } from 'h3'
import type { Role } from '~/utils/roles'
import {
  isPoemEditorRole,
  isSiteOwnerEmail,
  isStaffRole,
  normalizeRole,
  SITE_OWNER_EMAIL,
} from '~/utils/roles'

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
  const adminToken =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload?.role === 'admin') return payload
  }

  /** Google / site login uses `ph_user_token`; staff roles can use the admin panel without a second password login. */
  const user = await getUserFromEvent(event)
  if (user && isStaffRole(user.role)) {
    return { id: user.id, email: user.email, role: user.role }
  }
  /** Site owner (same email as `SITE_OWNER_EMAIL`) — full admin API when logged in with app session. */
  if (user && isSiteOwnerEmail(user.email)) {
    return { id: user.id, email: user.email, role: 'admin' }
  }

  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}

/**
 * Author profile updates on the public PDP (name, bio, nationality, …).
 * Admin JWT, or app user: moderator/admin, editor, or site-owner email.
 */
export async function requireAuthorCatalogEditor(event: H3Event) {
  const adminToken =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload?.role === 'admin') return payload
  }

  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (isPoemEditorRole(user.role)) return user
  if (isSiteOwnerEmail(user.email)) return { ...user, role: 'admin' }

  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

/** Admin cookie session, or logged-in app user with the site owner email (e.g. Google login). */
export async function requireAdminOrSiteOwnerUser(event: H3Event) {
  const adminToken =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload?.role === 'admin') return
  }
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (user.email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()) return
  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

// ─── User token ──────────────────────────────────────────────────────────────

export async function signUserToken(payload: {
  id: string
  email: string
  name?: string | null
  role: Role
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
    return { ...p, role: normalizeRole(p.role) }
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

/** App user (`ph_user_token`) or admin panel session (`ph_admin_token`). */
export async function getUserOrAdminFromEvent(
  event: H3Event,
): Promise<{ id: string; email: string; role: string } | null> {
  const u = await getUserFromEvent(event)
  if (u) return u
  const token =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const p = await verifyAdminToken(token)
  if (!p) return null
  return { id: p.id, email: p.email, role: p.role }
}

// ─── Cookie names ────────────────────────────────────────────────────────────

export { TOKEN_COOKIE, USER_TOKEN_COOKIE }
