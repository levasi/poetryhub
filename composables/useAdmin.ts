// Admin session composable — panel access uses /api/auth/me (JWT or app session)
interface AdminUser { id: string; email: string; role: string }

export function useAdmin() {
  const user = useState<AdminUser | null>('admin_user', () => null)

  async function fetchMe() {
    try {
      user.value = await $fetch<AdminUser>('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  const isLoggedIn = computed(() => user.value !== null)

  return { user, isLoggedIn, fetchMe, logout }
}
