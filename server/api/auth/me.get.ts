// GET /api/auth/me — returns current admin user from JWT cookie
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const payload = await requireAdmin(event)
  return { id: payload.id, email: payload.email, role: payload.role }
})
