import { beforeEach, describe, expect, it } from 'vitest'
import { createEvent } from 'h3'
import { useRuntimeConfig } from '#app'
import { getAppBaseUrl } from '~/server/utils/appBaseUrl'

function eventWithHeaders(
  url: string,
  headers: Record<string, string> = {},
) {
  const event = createEvent({ method: 'GET', url })
  event.node.req.headers = { ...headers }
  return event
}

describe('getAppBaseUrl', () => {
  beforeEach(() => {
    const config = useRuntimeConfig()
    config.public.appUrl = 'https://config.example.com'
  })

  it('prefers x-forwarded-host and proto on Vercel', () => {
    const event = eventWithHeaders('http://internal/', {
      'x-forwarded-host': 'poetryhub.vercel.app',
      'x-forwarded-proto': 'https',
    })
    expect(getAppBaseUrl(event)).toBe('https://poetryhub.vercel.app')
  })

  it('uses first host when multiple forwarded hosts', () => {
    const event = eventWithHeaders('http://internal/', {
      'x-forwarded-host': 'a.example.com, b.example.com',
    })
    expect(getAppBaseUrl(event)).toBe('https://a.example.com')
  })

  it('uses request URL origin when no proxy headers', () => {
    const event = eventWithHeaders('http://127.0.0.1:3000/')
    expect(getAppBaseUrl(event)).toBe('http://127.0.0.1:3000')
  })
})
