// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'
import { stableQueryKey } from '~/server/utils/cacheKeys'

function eventWithUrl(url: string) {
  const event = createEvent({ method: 'GET', url })
  event.node.req.url = url
  return event
}

describe('stableQueryKey', () => {
  beforeEach(() => {
    vi.stubGlobal('getQuery', (event: { node?: { req?: { url?: string } } }) => {
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
  })

  it('returns prefix only when query is empty', () => {
    expect(stableQueryKey('poems', eventWithUrl('/api/poems'))).toBe('poems')
  })

  it('sorts keys for stable cache keys', () => {
    expect(stableQueryKey('poems', eventWithUrl('/api/poems?tag=nature&page=2'))).toBe(
      'poems:page=2&tag=nature',
    )
  })
})
