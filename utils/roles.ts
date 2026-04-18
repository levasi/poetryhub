/** Account roles stored on `User.role` (Prisma `UserRole`). */
export type Role = 'user' | 'editor' | 'moderator' | 'admin'

/** Primary site owner — cannot be demoted from admin via API. */
export const SITE_OWNER_EMAIL = 'vasileeduardbogdan@gmail.com'

export function isSiteOwnerEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false
  return email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()
}

export function normalizeRole(role: string | null | undefined): Role {
  if (role === 'admin') return 'admin'
  if (role === 'moderator') return 'moderator'
  if (role === 'editor') return 'editor'
  return 'user'
}

/** Moderator/admin — author bio & catalog UX, admin panel login. */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'moderator'
}

/** May edit poem text & title site-wide (`editor`, moderator, admin). */
export function isPoemEditorRole(role: string | null | undefined): boolean {
  return role === 'editor' || role === 'admin' || role === 'moderator'
}

/** Same poem-edit UI as editors — plus the configured site owner email (even if DB role is still `user`). */
export function isPoemEditorRoleOrSiteOwner(
  role: string | null | undefined,
  email: string | null | undefined,
): boolean {
  return isPoemEditorRole(role) || isSiteOwnerEmail(email)
}
