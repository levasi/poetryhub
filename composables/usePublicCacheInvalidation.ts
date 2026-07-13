import type { Poem } from '~/composables/usePoems'
import { isStaffRole } from '~/utils/roles'

/** Staff-only: bust public Nitro caches and clear client feed state after catalog edits. */
export function usePublicCacheInvalidation() {
  const { user } = useAuth()

  async function invalidatePublicCachesIfStaff() {
    if (!isStaffRole(user.value?.role)) return
    await $fetch('/api/admin/invalidate-cache', { method: 'POST' })
    useState<Poem[]>('home-for-you-poems', () => []).value = []
    useState<Poem[]>('discover-newest-poems', () => []).value = []
  }

  return { invalidatePublicCachesIfStaff }
}
