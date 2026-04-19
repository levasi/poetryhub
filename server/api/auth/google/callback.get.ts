// GET /api/auth/google/callback — OAuth redirect from Google
import { UserRole } from '@prisma/client'
import { deleteCookie, getCookie, getQuery, sendRedirect, setCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { signUserToken, USER_TOKEN_COOKIE } from '~/server/utils/auth'
import { exchangeGoogleCode, fetchGoogleUserInfo } from '~/server/utils/googleOAuth'
import { normalizeRole } from '~/utils/roles'
import { getAppBaseUrl } from '~/server/utils/appBaseUrl'
import { getGoogleOAuthCredentials } from '~/server/utils/googleOAuthConfig'

const STATE_COOKIE = 'oauth_google_state'
const REDIRECT_COOKIE = 'oauth_google_redirect'

export default defineEventHandler(async (event) => {
  const { clientId, clientSecret } = getGoogleOAuthCredentials()
  if (!clientId || !clientSecret) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_config`, 302)
  }

  const q = getQuery(event)
  if (q.error) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_denied`, 302)
  }

  const code = typeof q.code === 'string' ? q.code : ''
  const state = typeof q.state === 'string' ? q.state : ''
  if (!code || !state) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_invalid`, 302)
  }

  const cookieState = getCookie(event, STATE_COOKIE)
  deleteCookie(event, STATE_COOKIE, { path: '/' })
  if (!cookieState || cookieState !== state) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_state`, 302)
  }

  const redirectRaw = getCookie(event, REDIRECT_COOKIE)
  deleteCookie(event, REDIRECT_COOKIE, { path: '/' })
  let redirectPath = '/'
  if (redirectRaw) {
    try {
      const decoded = decodeURIComponent(redirectRaw)
      if (decoded.startsWith('/')) redirectPath = decoded
    } catch {
      /* ignore */
    }
  }

  const redirectUri = `${getAppBaseUrl(event)}/api/auth/google/callback`

  let accessToken: string
  try {
    const tokens = await exchangeGoogleCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    })
    accessToken = tokens.access_token
  } catch {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_token`, 302)
  }

  let info
  try {
    info = await fetchGoogleUserInfo(accessToken)
  } catch {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_profile`, 302)
  }

  if (!info.email_verified) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_unverified`, 302)
  }

  const email = info.email.trim().toLowerCase()

  let user = await prisma.user.findUnique({ where: { googleId: info.sub } })
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: info.sub },
      })
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: info.name ?? null,
          googleId: info.sub,
          passwordHash: null,
          role: UserRole.user,
        },
      })
    }
  }

  const token = await signUserToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
  })

  setCookie(event, USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return sendRedirect(event, `${getAppBaseUrl(event)}${redirectPath}`, 302)
})
