// Nitro server plugin — in-memory rate limiter for sensitive auth endpoints.
// Limits: 10 attempts per IP per 60 seconds on POST /api/user/login.
// Uses an in-memory Map (per serverless instance); suitable for low-to-medium traffic.
// For high-scale production, replace with Upstash Redis or Vercel KV.

export default defineNitroPlugin((nitroApp) => {
  const attempts = new Map<string, { count: number; resetAt: number }>()

  nitroApp.hooks.hook('request', (event) => {
    if (event.path !== '/api/user/login' || event.method !== 'POST') return

    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    const now = Date.now()
    const record = attempts.get(ip)

    if (!record || now > record.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + 60_000 })
      return
    }

    record.count++
    if (record.count > 10) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many login attempts. Please wait a minute and try again.',
      })
    }
  })
})
