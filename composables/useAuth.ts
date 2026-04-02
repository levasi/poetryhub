// User auth composable
export interface AuthUser {
  id: string
  email: string
  name?: string
  /** `user` (default) or `admin` — set in DB; JWT refreshed on login */
  role?: 'user' | 'admin'
  poemFontFamily?: string
  poemFontSize?: number
  poemLineHeight?: number
  poemLetterSpacing?: number
}

export function useAuth() {
  const user    = useState<AuthUser | null>('auth_user', () => null)
  const loading = ref(false)

  async function fetchMe() {
    try {
      user.value = await $fetch<AuthUser>('/api/user/me')
    } catch {
      user.value = null
    }
  }

  async function register(email: string, password: string, name?: string) {
    loading.value = true
    try {
      const res = await $fetch<{ ok: boolean; user: AuthUser }>('/api/user/register', {
        method: 'POST',
        body: { email, password, name },
      })
      user.value = res.user
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, message: (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Registration failed' }
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await $fetch<{ ok: boolean; user: AuthUser }>('/api/user/login', {
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
    await $fetch('/api/user/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  const isLoggedIn = computed(() => user.value !== null)

  return { user, loading, isLoggedIn, fetchMe, register, login, logout }
}
