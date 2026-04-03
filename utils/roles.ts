/** Account roles stored on `User.role` (Prisma `UserRole`). */
export type Role = 'user' | 'moderator' | 'admin'

/** Primary site owner — cannot be demoted from admin via API. */
export const SITE_OWNER_EMAIL = 'vasileeduardbogdan@gmail.com'

export function normalizeRole(role: string | null | undefined): Role {
  if (role === 'admin') return 'admin'
  if (role === 'moderator') return 'moderator'
  return 'user'
}

/** Full content/poem edit powers (any poem), distinct from catalog-only users. */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'moderator'
}
