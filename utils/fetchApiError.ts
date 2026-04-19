/**
 * Normalize $fetch / ofetch / Nitro error shapes so UI can read status + app codes.
 */
export function getFetchErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as Record<string, unknown>
  if (typeof e.statusCode === 'number') return e.statusCode
  const data = e.data
  if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).statusCode === 'number') {
    return (data as Record<string, unknown>).statusCode as number
  }
  return undefined
}

/** Reads `code` from createError `data` (sometimes nested under `data.data`). */
export function getFetchErrorDataCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as Record<string, unknown>
  const tryRecord = (o: unknown): string | undefined => {
    if (!o || typeof o !== 'object') return undefined
    const r = o as Record<string, unknown>
    if (typeof r.code === 'string') return r.code
    const inner = r.data
    if (inner && typeof inner === 'object' && typeof (inner as Record<string, unknown>).code === 'string') {
      return (inner as Record<string, unknown>).code as string
    }
    return undefined
  }
  return tryRecord(e) ?? tryRecord(e.data) ?? tryRecord(e.cause)
}

export function getFetchErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as Record<string, unknown>
  const data = e.data
  if (data && typeof data === 'object') {
    const sm = (data as Record<string, unknown>).statusMessage
    if (typeof sm === 'string' && sm.trim()) return sm
  }
  if (typeof e.statusMessage === 'string' && e.statusMessage.trim()) return e.statusMessage
  return undefined
}
