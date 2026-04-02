import { getQuery, type H3Event } from 'h3'

/** Stable cache key from sorted query string (avoids duplicate cache entries for same params). */
export function stableQueryKey(prefix: string, event: H3Event): string {
  const q = getQuery(event)
  const keys = Object.keys(q).sort()
  if (keys.length === 0) return prefix
  return `${prefix}:${keys.map((k) => `${k}=${String(q[k])}`).join('&')}`
}

/** Local calendar day — matches `daily.get` day-of-year logic (same timezone as the server/runtime). */
export function localDayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
