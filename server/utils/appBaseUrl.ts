import type { H3Event } from 'h3'
import { getRequestHeader, getRequestURL } from 'h3'

/**
 * Canonical origin (scheme + host) for redirects and OAuth `redirect_uri`.
 * Uses proxy headers on Vercel so production works even if `NUXT_PUBLIC_APP_URL`
 * was missing or wrong at build time.
 */
export function getAppBaseUrl(event: H3Event): string {
  const config = useRuntimeConfig()
  const fromConfig = String(config.public.appUrl || '').replace(/\/$/, '')

  const xfHost = getRequestHeader(event, 'x-forwarded-host')
  const xfProto = getRequestHeader(event, 'x-forwarded-proto')

  if (xfHost) {
    const host = xfHost.split(',')[0].trim()
    const rawProto = xfProto ? String(xfProto).split(',')[0].trim() : ''
    const proto = rawProto === 'http' || rawProto === 'https' ? rawProto : 'https'
    return `${proto}://${host}`.replace(/\/$/, '')
  }

  try {
    const url = getRequestURL(event)
    const origin = `${url.protocol}//${url.host}`.replace(/\/$/, '')
    if (origin) return origin
  } catch {
    /* ignore */
  }

  if (fromConfig) return fromConfig
  return 'http://localhost:3000'
}
