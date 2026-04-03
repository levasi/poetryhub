import { isStaffRole } from '~/utils/roles'

/**
 * Who may change poem rows via user session (not admin JWT).
 * Staff (admin, moderator) may edit any poem; others only poems they submitted.
 */
export function userCanEditPoem(
  user: { id: string; role?: string },
  poem: { submittedByUserId: string | null },
): boolean {
  if (isStaffRole(user.role)) return true
  return poem.submittedByUserId != null && poem.submittedByUserId === user.id
}
