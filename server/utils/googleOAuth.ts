/** Exchange Google OAuth code and fetch user profile (openid email profile). */

export interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}

export async function exchangeGoogleCode(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token exchange failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<{ access_token: string }>
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google userinfo failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<GoogleUserInfo>
}
