// GET /api/auth/google — start Google OAuth (redirect)
import { randomBytes } from 'node:crypto'
import { getQuery, sendRedirect, setCookie } from 'h3'
import { getAppBaseUrl } from '~/server/utils/appBaseUrl'
import { getGoogleOAuthCredentials } from '~/server/utils/googleOAuthConfig'

const STATE_COOKIE = 'oauth_google_state'
const REDIRECT_COOKIE = 'oauth_google_redirect'
const COOKIE_MAX_AGE = 60 * 10

export default defineEventHandler(async (event) => {
  const { clientId, clientSecret } = getGoogleOAuthCredentials()
  if (!clientId || !clientSecret) {
    return sendRedirect(event, `${getAppBaseUrl(event)}/login?error=google_config`, 302)
  }

  const q = getQuery(event)
  const redirectAfter = typeof q.redirect === 'string' && q.redirect.startsWith('/') ? q.redirect : '/'

  const state = randomBytes(24).toString('hex')
  const cookieOpts = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  }
  setCookie(event, STATE_COOKIE, state, cookieOpts)
  setCookie(event, REDIRECT_COOKIE, encodeURIComponent(redirectAfter), cookieOpts)

  const base = getAppBaseUrl(event)
  const redirectUri = `${base}/api/auth/google/callback`

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('access_type', 'online')

  return sendRedirect(event, url.toString(), 302)
})
