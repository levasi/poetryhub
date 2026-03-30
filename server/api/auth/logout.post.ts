// POST /api/auth/logout — clears admin JWT cookie
import { deleteCookie } from 'h3'
import { TOKEN_COOKIE } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  deleteCookie(event, TOKEN_COOKIE, { path: '/' })
  return { ok: true }
})
