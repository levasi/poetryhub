import { getQuery, type H3Event } from 'h3'

/** Stable cache key from sorted query string (avoids duplicate cache entries for same params). */
export function stableQueryKey(prefix: string, event: H3Event): string {
  const q = getQuery(event)
  const keys = Object.keys(q).sort()
  if (keys.length === 0) return prefix
  return `${prefix}:${keys.map((k) => `${k}=${String(q[k])}`).join('&')}`
}
