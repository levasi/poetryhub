// GET /api/auth/google-config — whether Google OAuth is configured (runtime; not build-time)
import { setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'no-store')
  const config = useRuntimeConfig()
  const id = String(config.oauthGoogleClientId || '').trim()
  const secret = String(config.oauthGoogleClientSecret || '').trim()
  return { enabled: Boolean(id && secret) }
})
