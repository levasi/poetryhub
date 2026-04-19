// Client-side middleware: protect all /admin/* routes
// Verifies access via /api/auth/me (admin JWT or app session with staff access)
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  try {
    await $fetch('/api/auth/me')
  } catch {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
