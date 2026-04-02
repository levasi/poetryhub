export const COLOR_SCHEMES = ['paper', 'ink', 'sepia', 'qi'] as const
export type ColorSchemeId = (typeof COLOR_SCHEMES)[number]

const STORAGE_KEY = 'ph-color-scheme'

export function isColorSchemeId(v: string): v is ColorSchemeId {
  return (COLOR_SCHEMES as readonly string[]).includes(v)
}

export function useColorScheme() {
  const scheme = useState<ColorSchemeId>('color_scheme', () => 'paper')

  function applyScheme(id: ColorSchemeId) {
    scheme.value = id
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-color-scheme', id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore quota / private mode */
    }
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

  return { scheme, applyScheme, hydrate }
}
