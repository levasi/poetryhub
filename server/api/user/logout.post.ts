// POST /api/user/logout
import { deleteCookie } from 'h3'
import { USER_TOKEN_COOKIE } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  deleteCookie(event, USER_TOKEN_COOKIE, { path: '/' })
  return { ok: true }
})
