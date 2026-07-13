import type { AuthUser } from '~/composables/useAuth'
import {
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  isColorSchemeId,
  type ColorSchemeId,
} from '~/utils/colorScheme'

export { COLOR_SCHEMES, isColorSchemeId, type ColorSchemeId } from '~/utils/colorScheme'

const STORAGE_KEY = 'ph-color-scheme'

function schemeFromUser(u: AuthUser | null): ColorSchemeId | null {
  if (!u?.colorScheme || !isColorSchemeId(u.colorScheme)) return null
  return u.colorScheme
}

export function useColorScheme() {
  const { user, isLoggedIn } = useAuth()
  const scheme = useState<ColorSchemeId>('color_scheme', () => DEFAULT_COLOR_SCHEME)

  function applyToDom(id: ColorSchemeId) {
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-color-scheme', id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore quota / private mode */
    }
  }

  function applyScheme(id: ColorSchemeId) {
    scheme.value = id
    applyToDom(id)
    scheduleSaveToAccount()
  }

  /** Sync Vue state from DOM (set by inline script before paint) or localStorage */
  function hydrate() {
    if (!import.meta.client) return
    const fromDom = document.documentElement.getAttribute('data-color-scheme')
    if (fromDom && isColorSchemeId(fromDom)) {
      scheme.value = fromDom
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw && isColorSchemeId(raw)) {
        scheme.value = raw
        document.documentElement.setAttribute('data-color-scheme', raw)
      }
    } catch {
      /* ignore */
    }
  }

  function syncFromUserOrLocal() {
    const fromUser = schemeFromUser(user.value)
    if (fromUser) {
      scheme.value = fromUser
      applyToDom(fromUser)
      return
    }
    hydrate()
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  async function saveToAccount() {
    if (!isLoggedIn.value) return
    try {
      await $fetch('/api/user/me/preferences', {
        method: 'PATCH',
        body: { colorScheme: scheme.value },
      })
      if (user.value) {
        user.value = { ...user.value, colorScheme: scheme.value }
      }
    } catch {
      /* ignore */
    }
  }

  function scheduleSaveToAccount() {
    if (!isLoggedIn.value) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      void saveToAccount()
    }, 450)
  }

  watch(
    () => user.value,
    () => {
      syncFromUserOrLocal()
    },
    { immediate: true },
  )

  return { scheme, applyScheme, hydrate, syncFromUserOrLocal }
}
