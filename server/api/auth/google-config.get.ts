// GET /api/auth/google-config — whether Google OAuth is configured (runtime; not build-time)
import { setHeader } from 'h3'
import { isGoogleOAuthConfigured } from '~/server/utils/googleOAuthConfig'

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'no-store')
  return { enabled: isGoogleOAuthConfigured() }
})
