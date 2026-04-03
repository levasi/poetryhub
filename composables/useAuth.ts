import type { Role } from '~/utils/roles'

// User auth composable
export interface AuthUser {
  id: string
  email: string
  name?: string
  /** Set in DB; JWT refreshed on login */
  role?: Role
  createdAt?: string | Date
  poemFontFamily?: string
  poemFontSize?: number
  poemLineHeight?: number
  poemLetterSpacing?: number
  /** False for Google-only accounts until they set a password */
  hasPassword?: boolean
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const loading = ref(false)
  /** SSR: forward cookies so /api/user/me matches the client; avoids AppNav hydration mismatch (fragment vs div). */
  const requestFetch = import.meta.server ? useRequestFetch() : null

  async function fetchMe() {
    try {
      const fetcher = requestFetch ?? $fetch
      user.value = await fetcher<AuthUser>('/api/user/me')
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

  /** Full-page navigation to Google OAuth (sets session cookie on return). */
  function loginWithGoogle(redirectPath = '/') {
    const path = redirectPath.startsWith('/') ? redirectPath : '/'
    const url = `/api/auth/google?redirect=${encodeURIComponent(path)}`
    if (import.meta.client) window.location.assign(url)
    else return navigateTo(url, { external: true })
  }

  return { user, loading, isLoggedIn, fetchMe, register, login, logout, loginWithGoogle }
}
