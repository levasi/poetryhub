import { createEvent, type H3Event } from 'h3'
import { vi } from 'vitest'

export function buildGetEvent(query: Record<string, string | string[] | undefined> = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    } else {
      params.set(key, value)
    }
  }
  const qs = params.toString()
  const url = qs ? `/api?${qs}` : '/api'
  const event = createEvent({ method: 'GET', url })
  event.node.req.url = url
  return event
}

export function buildPostEvent(body: unknown, url = '/api') {
  const event = createEvent({ method: 'POST', url })
  event.node.req.url = url
  return { event, body }
}

export function stubNitroGlobals() {
  vi.stubGlobal('getQuery', (event: H3Event) => {
    const url = event.node?.req?.url ?? ''
    const i = url.indexOf('?')
    const search = i === -1 ? '' : url.slice(i + 1)
    const params = new URLSearchParams(search)
    const out: Record<string, string | string[]> = {}
    for (const key of new Set([...params.keys()])) {
      const all = params.getAll(key)
      out[key] = all.length > 1 ? all : all[0]!
    }
    return out
  })
  vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  })
  vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  vi.stubGlobal('defineCachedEventHandler', (fn: unknown) => fn)
  vi.stubGlobal('readBody', async (event: H3Event & { _testBody?: unknown }) => event._testBody)
  vi.stubGlobal('setCookie', vi.fn())
  vi.stubGlobal('setHeader', vi.fn())
}

export async function callHandler<T>(
  importPath: string,
  event: H3Event & { _testBody?: unknown },
  body?: unknown,
): Promise<T> {
  if (body !== undefined) event._testBody = body
  const mod = await import(importPath)
  const handler = mod.default as (e: typeof event) => Promise<T>
  return handler(event)
}
