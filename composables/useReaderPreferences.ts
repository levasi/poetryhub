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
  | 'verdana'
  | 'roboto'
  | 'helvetica'
  /** Literata-led stack as a web-available substitute for Kindle Bookerly (Bookerly is not licensed for web). */
  | 'bookerly'

const LS_FONT = 'ph_reader_font'
const LS_SIZE = 'ph_reader_size'
const LS_LINE = 'ph_reader_line'
const LS_LETTER = 'ph_reader_letter'

/** Line height multiplier (CSS unitless). */
export const READER_LINE_HEIGHT_MIN = 1
export const READER_LINE_HEIGHT_MAX = 2.5
export const READER_LINE_HEIGHT_DEFAULT = 1.2
export const READER_LINE_HEIGHT_STEP = 0.05

/** Letter spacing in em (CSS `letter-spacing`). */
export const READER_LETTER_SPACING_MIN = 0
export const READER_LETTER_SPACING_MAX = 0.3
export const READER_LETTER_SPACING_DEFAULT = 0.02
export const READER_LETTER_SPACING_STEP = 0.005

function clampLineHeight(n: number): number {
  const t = Math.round(n * 100) / 100
  return Math.min(READER_LINE_HEIGHT_MAX, Math.max(READER_LINE_HEIGHT_MIN, t))
}

function clampLetterSpacingEm(n: number): number {
  const t = Math.round(n * 1000) / 1000
  return Math.min(READER_LETTER_SPACING_MAX, Math.max(READER_LETTER_SPACING_MIN, t))
}

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
  'eb-garamond': "'EB Garamond', 'Times New Roman', serif",
  verdana: "Verdana, Geneva, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  helvetica: "Helvetica, 'Helvetica Neue', Arial, ui-sans-serif, sans-serif",
  bookerly: "'Literata', 'Merriweather', Georgia, serif",
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
  verdana: 'viewer.fontVerdana',
  roboto: 'viewer.fontRoboto',
  helvetica: 'viewer.fontHelvetica',
  bookerly: 'viewer.fontBookerly',
}

/** Tooltip (title) copy for fonts with editorial blurbs — see i18n `viewer.fontDesc*`. */
export const READER_FONT_DESC_I18N_KEYS: Partial<Record<ReaderFontKey, string>> = {
  georgia: 'viewer.fontDescGeorgia',
  'eb-garamond': 'viewer.fontDescGaramond',
  verdana: 'viewer.fontDescVerdana',
  roboto: 'viewer.fontDescRoboto',
  helvetica: 'viewer.fontDescHelvetica',
  bookerly: 'viewer.fontDescBookerly',
}

function isFontKey(v: string): v is ReaderFontKey {
  return v in READER_FONT_STACKS
}

function prefsFromUser(u: AuthUser | null): {
  font: ReaderFontKey
  size: number
  lineHeight: number
  letterSpacingEm: number
} | null {
  if (!u || !('poemFontFamily' in u) || !u.poemFontFamily) return null
  if (!isFontKey(u.poemFontFamily)) return null
  const raw = typeof u.poemFontSize === 'number' ? u.poemFontSize : 16
  const lhRaw = typeof u.poemLineHeight === 'number' ? u.poemLineHeight : READER_LINE_HEIGHT_DEFAULT
  const lsRaw = typeof u.poemLetterSpacing === 'number' ? u.poemLetterSpacing : READER_LETTER_SPACING_DEFAULT
  return {
    font: u.poemFontFamily,
    size: Math.min(48, Math.max(16, raw)),
    lineHeight: clampLineHeight(lhRaw),
    letterSpacingEm: clampLetterSpacingEm(lsRaw),
  }
}

/** Order in the font dropdown — curated serifs/sans, then remaining library faces. */
export const READER_FONT_OPTIONS_ORDER = [
  'georgia',
  'eb-garamond',
  'verdana',
  'roboto',
  'helvetica',
  'bookerly',
  'playfair',
  'literata',
  'lora',
  'merriweather',
  'crimson',
  'noto-serif',
  'source-serif',
  'inter',
] as const satisfies readonly ReaderFontKey[]

export function useReaderPreferences() {
  const { user, isLoggedIn } = useAuth()

  /** Shared across PoetryViewer, poem cards, etc. so one source of truth. */
  const fontKey = useState<ReaderFontKey>('reader-pref-font', () => 'playfair')
  const fontSizePx = useState<number>('reader-pref-size', () => 16)
  const lineHeight = useState<number>('reader-pref-line-height', () => READER_LINE_HEIGHT_DEFAULT)
  const letterSpacingEm = useState<number>('reader-pref-letter-spacing', () => READER_LETTER_SPACING_DEFAULT)

  const fontFamilyCss = computed(() => READER_FONT_STACKS[fontKey.value])

  function readLocal(): {
    font: ReaderFontKey
    size: number
    lineHeight: number
    letterSpacingEm: number
  } | null {
    if (!import.meta.client) return null
    const rf = localStorage.getItem(LS_FONT)
    const rs = localStorage.getItem(LS_SIZE)
    const rl = localStorage.getItem(LS_LINE)
    const rls = localStorage.getItem(LS_LETTER)
    if (!rf && !rs && !rl && !rls) return null
    const font = rf && isFontKey(rf) ? rf : null
    const size = rs ? parseInt(rs, 10) : NaN
    const lh = rl ? parseFloat(rl) : NaN
    const ls = rls ? parseFloat(rls) : NaN
    return {
      font: font ?? 'playfair',
      size: Number.isFinite(size) && size >= 16 && size <= 48 ? size : 16,
      lineHeight: Number.isFinite(lh) ? clampLineHeight(lh) : READER_LINE_HEIGHT_DEFAULT,
      letterSpacingEm: Number.isFinite(ls) ? clampLetterSpacingEm(ls) : READER_LETTER_SPACING_DEFAULT,
    }
  }

  function writeLocal() {
    if (!import.meta.client) return
    localStorage.setItem(LS_FONT, fontKey.value)
    localStorage.setItem(LS_SIZE, String(fontSizePx.value))
    localStorage.setItem(LS_LINE, String(lineHeight.value))
    localStorage.setItem(LS_LETTER, String(letterSpacingEm.value))
  }

  function applyFromUserOrLocal() {
    const fromUser = prefsFromUser(user.value)
    if (fromUser) {
      fontKey.value = fromUser.font
      fontSizePx.value = fromUser.size
      lineHeight.value = fromUser.lineHeight
      letterSpacingEm.value = fromUser.letterSpacingEm
      return
    }
    const loc = readLocal()
    if (loc) {
      fontKey.value = loc.font
      fontSizePx.value = loc.size
      lineHeight.value = loc.lineHeight
      letterSpacingEm.value = loc.letterSpacingEm
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
        body: {
          poemFontFamily: fontKey.value,
          poemFontSize: fontSizePx.value,
          poemLineHeight: lineHeight.value,
          poemLetterSpacing: letterSpacingEm.value,
        },
      })
      if (user.value) {
        user.value = {
          ...user.value,
          poemFontFamily: fontKey.value,
          poemFontSize: fontSizePx.value,
          poemLineHeight: lineHeight.value,
          poemLetterSpacing: letterSpacingEm.value,
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

  /** Poem color follows design tokens (`--color-poem-text`) so Cerneală / Sepia stay readable */
  const poemBodyStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `${fontSizePx.value}px`,
    lineHeight: lineHeight.value,
    color: 'rgb(var(--color-poem-text))',
    letterSpacing: `${letterSpacingEm.value}em`,
  }))

  const stanzaSlideStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `clamp(${Math.max(16, fontSizePx.value - 2)}px, 3vw, ${Math.min(52, fontSizePx.value + 4)}px)`,
    lineHeight: lineHeight.value,
    color: 'rgb(var(--color-poem-text))',
    letterSpacing: `${letterSpacingEm.value}em`,
  }))

  return {
    fontKey,
    fontSizePx,
    lineHeight,
    letterSpacingEm,
    fontFamilyCss,
    poemBodyStyle,
    stanzaSlideStyle,
    onReaderPreferenceChange,
    cycleFont,
    fontOptions: READER_FONT_OPTIONS_ORDER,
  }
}
