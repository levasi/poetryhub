import type { AuthUser } from '~/composables/useAuth'

/** Keys stored in `User.poemFontFamily` and localStorage. */
export type ReaderFontKey =
  | 'playfair'
  | 'georgia'
  | 'inter'
  | 'lora'
  | 'literata'
  | 'merriweather'
  | 'source-serif'
  | 'crimson'
  | 'noto-serif'
  | 'eb-garamond'

const LS_FONT = 'ph_reader_font'
const LS_SIZE = 'ph_reader_size'

/** CSS font-family stacks (Google fonts loaded in nuxt.config). */
export const READER_FONT_STACKS: Record<ReaderFontKey, string> = {
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "'Inter', system-ui, sans-serif",
  lora: "'Lora', Georgia, serif",
  literata: "'Literata', Georgia, serif",
  merriweather: "'Merriweather', Georgia, serif",
  'source-serif': "'Source Serif 4', Georgia, 'Times New Roman', serif",
  crimson: "'Crimson Pro', Georgia, serif",
  'noto-serif': "'Noto Serif', Georgia, serif",
  'eb-garamond': "'EB Garamond', serif",
}

/** i18n keys under `viewer.*` for each font option label. */
export const READER_FONT_I18N_KEYS: Record<ReaderFontKey, string> = {
  playfair: 'viewer.fontPlayfair',
  georgia: 'viewer.fontGeorgia',
  inter: 'viewer.fontInter',
  lora: 'viewer.fontLora',
  literata: 'viewer.fontLiterata',
  merriweather: 'viewer.fontMerriweather',
  'source-serif': 'viewer.fontSourceSerif4',
  crimson: 'viewer.fontCrimsonPro',
  'noto-serif': 'viewer.fontNotoSerif',
  'eb-garamond': 'viewer.fontEBGaramond',
}

function isFontKey(v: string): v is ReaderFontKey {
  return v in READER_FONT_STACKS
}

function prefsFromUser(u: AuthUser | null): { font: ReaderFontKey; size: number } | null {
  if (!u || !('poemFontFamily' in u) || !u.poemFontFamily) return null
  if (!isFontKey(u.poemFontFamily)) return null
  const raw = typeof u.poemFontSize === 'number' ? u.poemFontSize : 22
  return { font: u.poemFontFamily, size: Math.min(48, Math.max(16, raw)) }
}

/** Order in the font dropdown (reading-friendly serifs first, then system / sans). */
export const READER_FONT_OPTIONS_ORDER = [
  'literata',
  'source-serif',
  'lora',
  'merriweather',
  'crimson',
  'noto-serif',
  'eb-garamond',
  'playfair',
  'georgia',
  'inter',
] as const satisfies readonly ReaderFontKey[]

export function useReaderPreferences() {
  const { user, isLoggedIn } = useAuth()

  /** Shared across PoetryViewer, poem cards, etc. so one source of truth. */
  const fontKey = useState<ReaderFontKey>('reader-pref-font', () => 'playfair')
  const fontSizePx = useState<number>('reader-pref-size', () => 22)

  const fontFamilyCss = computed(() => READER_FONT_STACKS[fontKey.value])

  function readLocal(): { font: ReaderFontKey; size: number } | null {
    if (!import.meta.client) return null
    const rf = localStorage.getItem(LS_FONT)
    const rs = localStorage.getItem(LS_SIZE)
    const font = rf && isFontKey(rf) ? rf : null
    const size = rs ? parseInt(rs, 10) : NaN
    if (!font && Number.isNaN(size)) return null
    return {
      font: font ?? 'playfair',
      size: Number.isFinite(size) && size >= 16 && size <= 48 ? size : 22,
    }
  }

  function writeLocal() {
    if (!import.meta.client) return
    localStorage.setItem(LS_FONT, fontKey.value)
    localStorage.setItem(LS_SIZE, String(fontSizePx.value))
  }

  function applyFromUserOrLocal() {
    const fromUser = prefsFromUser(user.value)
    if (fromUser) {
      fontKey.value = fromUser.font
      fontSizePx.value = fromUser.size
      return
    }
    const loc = readLocal()
    if (loc) {
      fontKey.value = loc.font
      fontSizePx.value = loc.size
    }
  }

  watch(
    () => user.value,
    () => {
      applyFromUserOrLocal()
    },
    { immediate: true },
  )

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  async function saveToAccount() {
    if (!isLoggedIn.value) return
    try {
      await $fetch('/api/user/me/preferences', {
        method: 'PATCH',
        body: { poemFontFamily: fontKey.value, poemFontSize: fontSizePx.value },
      })
      if (user.value) {
        user.value = {
          ...user.value,
          poemFontFamily: fontKey.value,
          poemFontSize: fontSizePx.value,
        }
      }
    } catch {
      /* ignore */
    }
  }

  function onReaderPreferenceChange() {
    writeLocal()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      void saveToAccount()
    }, 450)
  }

  /** Cycle font with ← / → (matches `READER_FONT_OPTIONS_ORDER`). */
  function cycleFont(dir: -1 | 1) {
    const order = READER_FONT_OPTIONS_ORDER as readonly ReaderFontKey[]
    const i = order.indexOf(fontKey.value)
    const idx = i >= 0 ? i : 0
    const next = (idx + dir + order.length) % order.length
    fontKey.value = order[next]
    onReaderPreferenceChange()
  }

  const poemBodyStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `${fontSizePx.value}px`,
    lineHeight: 1.2,
    color: '#2d2d26',
    letterSpacing: '0.02em',
  }))

  const stanzaSlideStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `clamp(${Math.max(16, fontSizePx.value - 2)}px, 3vw, ${Math.min(52, fontSizePx.value + 4)}px)`,
    lineHeight: 1.2,
    color: '#2d2d26',
    letterSpacing: '0.02em',
  }))

  return {
    fontKey,
    fontSizePx,
    fontFamilyCss,
    poemBodyStyle,
    stanzaSlideStyle,
    onReaderPreferenceChange,
    cycleFont,
    fontOptions: READER_FONT_OPTIONS_ORDER,
  }
}
