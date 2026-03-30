// Admin session composable
interface AdminUser { id: string; email: string; role: string }

export function useAdmin() {
  const user    = useState<AdminUser | null>('admin_user', () => null)
  const loading = ref(false)

  async function fetchMe() {
    try {
      user.value = await $fetch<AdminUser>('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await $fetch<{ ok: boolean; user: AdminUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = res.user
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, message: (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/admin/login')
  }

  const isLoggedIn = computed(() => user.value !== null)

  return { user, loading, isLoggedIn, fetchMe, login, logout }
}
