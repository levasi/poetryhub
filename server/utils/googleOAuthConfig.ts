/**
 * Google OAuth client id + secret for server handlers.
 * Merges Nitro runtimeConfig with process.env so values from `.env` / `.env.local`
 * are visible even when the dev server cached empty config from an earlier startup.
 */
export function getGoogleOAuthCredentials() {
  const config = useRuntimeConfig()
  const id = String(
    config.oauthGoogleClientId ||
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ||
      process.env.NUXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID ||
      '',
  ).trim()
  const secret = String(
    config.oauthGoogleClientSecret || process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || '',
  ).trim()
  return { clientId: id, clientSecret: secret }
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthCredentials()
  return Boolean(clientId && clientSecret)
}
