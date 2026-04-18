import { isPoemEditorRole, isSiteOwnerEmail } from '~/utils/roles'

/**
 * Who may change poem rows via user session (not admin JWT).
 * Editors, staff, and the site owner email may edit any poem; others only poems they submitted.
 */
export function userCanEditPoem(
  user: { id: string; role?: string; email?: string },
  poem: { submittedByUserId: string | null },
): boolean {
  if (isPoemEditorRole(user.role)) return true
  if (isSiteOwnerEmail(user.email)) return true
  return poem.submittedByUserId != null && poem.submittedByUserId === user.id
}
