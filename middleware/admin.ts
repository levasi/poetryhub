// Client-side middleware: protect all /admin/* routes
// Verifies presence of admin session via /api/auth/me
export default defineNuxtRouteMiddleware(async (to) => {
  // Only guard /admin routes (but not /admin/login)
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return

  try {
    await $fetch('/api/auth/me')
  } catch {
    // Redirect to login, preserving intended destination
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
