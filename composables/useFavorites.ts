// Favorites composable
// - When user is logged in: syncs with server (GET/POST /api/user/favorites)
// - When logged out: falls back to localStorage
// - Shared state + single in-flight GET so each PoetryCard does not refetch.

const STORAGE_KEY = 'ph_favorites'

/** Client-only: dedupe concurrent loadFromServer across many components */
let serverLoadInFlight: Promise<void> | null = null

export function useFavorites() {
  const { isLoggedIn } = useAuth()
  const favoriteIdsState = useState<string[]>('ph-favorite-ids', () => [])
  const favoriteIds = computed(() => new Set(favoriteIdsState.value))

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

    watch(isLoggedIn, async (loggedIn) => {
      if (loggedIn) {
        await loadFromServer()
      } else {
        loadLocal()
      }
    })
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async function toggle(id: string) {
    if (isLoggedIn.value) {
      const res = await $fetch<{ favorited: boolean }>(`/api/user/favorites/${id}`, { method: 'POST' })
      if (res.favorited) {
        if (!favoriteIdsState.value.includes(id)) {
          favoriteIdsState.value = [...favoriteIdsState.value, id]
        }
      } else {
        favoriteIdsState.value = favoriteIdsState.value.filter((x) => x !== id)
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
    if (isLoggedIn.value) {
      for (const id of favoriteIdsState.value) {
        await $fetch(`/api/user/favorites/${id}`, { method: 'POST' }).catch(() => {})
      }
    } else if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
    favoriteIdsState.value = []
  }

  const count = computed(() => favoriteIdsState.value.length)

  return { favoriteIds, toggle, isFavorite, clearAll, count }
}
