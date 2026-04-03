// Favorites composable
// - When user is logged in: syncs with server (GET/POST /api/user/favorites)
// - When logged out: falls back to localStorage
// - On login: merges local favorites into the server account
// - On logout: persists current favorites to localStorage so they stay on the device
// - Shared state + single in-flight GET so each PoetryCard does not refetch.

const STORAGE_KEY = 'ph_favorites'

/** Client-only: dedupe concurrent loadFromServer across many components */
let serverLoadInFlight: Promise<void> | null = null

export function useFavorites() {
  const { isLoggedIn } = useAuth()
  const { t } = useI18n()
  const favoriteIdsState = useState<string[]>('ph-favorite-ids', () => [])
  const favoriteIds = computed(() => new Set(favoriteIdsState.value))
  /** Same IDs as `favoriteIds`, in display order (server: newest first; local: order saved). */
  const favoriteIdOrder = computed(() => favoriteIdsState.value)
  /** Last server/local favorite action error (shown in layout; cleared on success or dismiss). */
  const favoriteOpError = useState<string | null>('ph-favorite-op-error', () => null)

  // ── localStorage helpers ────────────────────────────────────────────────

  function loadLocal() {
    if (!process.client) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) favoriteIdsState.value = [...new Set(JSON.parse(stored) as string[])]
    } catch { /* ignore */ }
  }

  function persistLocal() {
    if (!process.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIdsState.value))
  }

  // ── Server sync ─────────────────────────────────────────────────────────

  async function loadFromServer() {
    if (!serverLoadInFlight) {
      serverLoadInFlight = (async () => {
        try {
          const res = await $fetch<{ ids: string[] }>('/api/user/favorites')
          favoriteIdsState.value = [...new Set(res.ids)]
        } catch { /* ignore */ }
      })().finally(() => {
        serverLoadInFlight = null
      })
    }
    return serverLoadInFlight
  }

  // ── Init ────────────────────────────────────────────────────────────────

  if (process.client) {
    if (isLoggedIn.value) {
      void loadFromServer()
    } else {
      loadLocal()
    }

    watch(isLoggedIn, async (loggedIn, wasLoggedIn) => {
      if (!process.client) return
      if (loggedIn && wasLoggedIn === false) {
        const localIds = [...favoriteIdsState.value]
        await loadFromServer()
        const serverSet = new Set(favoriteIdsState.value)
        for (const id of localIds) {
          if (!serverSet.has(id)) {
            try {
              const res = await $fetch<{ favorited: boolean }>(`/api/user/favorites/${id}`, { method: 'POST' })
              if (res.favorited) serverSet.add(id)
            } catch { /* poem missing or network */ }
          }
        }
        await loadFromServer()
      } else if (!loggedIn && wasLoggedIn === true) {
        persistLocal()
      }
    })
  }

  function dismissFavoriteError() {
    favoriteOpError.value = null
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async function toggle(id: string) {
    favoriteOpError.value = null
    if (isLoggedIn.value) {
      try {
        const res = await $fetch<{ favorited: boolean }>(`/api/user/favorites/${id}`, { method: 'POST' })
        if (res.favorited) {
          if (!favoriteIdsState.value.includes(id)) {
            favoriteIdsState.value = [...favoriteIdsState.value, id]
          }
        } else {
          favoriteIdsState.value = favoriteIdsState.value.filter((x) => x !== id)
        }
      } catch {
        favoriteOpError.value = t('favorites.toggleError')
      }
    } else {
      const next = new Set(favoriteIdsState.value)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      favoriteIdsState.value = [...next]
      persistLocal()
    }
  }

  function isFavorite(id: string) {
    return favoriteIdsState.value.includes(id)
  }

  async function clearAll() {
    favoriteOpError.value = null
    if (isLoggedIn.value) {
      const ids = [...favoriteIdsState.value]
      for (const id of ids) {
        try {
          await $fetch(`/api/user/favorites/${id}`, { method: 'POST' })
        } catch {
          favoriteOpError.value = t('favorites.clearError')
          await loadFromServer()
          return
        }
      }
    } else if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
    favoriteIdsState.value = []
  }

  const count = computed(() => favoriteIdsState.value.length)

  return {
    favoriteIds,
    favoriteIdOrder,
    toggle,
    isFavorite,
    clearAll,
    count,
    favoriteOpError,
    dismissFavoriteError,
  }
}
