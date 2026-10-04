import type { AuthUser } from '~/composables/useAuth'
import {
  READER_FONT_STACKS,
  type ReaderFontKey,
} from '~/composables/useReaderPreferences'

const LS_FONT = 'ph_write_card_font'
const LS_SIZE = 'ph_write_card_size'
const LS_LINE = 'ph_write_card_line'

const SIZE_MIN = 14
const SIZE_MAX = 28
const LINE_MIN = 1.2
const LINE_MAX = 2.2
const LINE_STEP = 0.05

export const WRITE_CARD_FONT_DEFAULT: ReaderFontKey = 'playfair'
export const WRITE_CARD_SIZE_DEFAULT = 16
export const WRITE_CARD_LINE_DEFAULT = 1.65

type CardFontPrefs = {
  font: ReaderFontKey
  size: number
  line: number
}

function isFontKey(v: string): v is ReaderFontKey {
  return v in READER_FONT_STACKS
}

function clampSize(n: number) {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(n)))
}

function clampLine(n: number) {
  const snapped = Math.round(n / LINE_STEP) * LINE_STEP
  const t = Math.round(snapped * 100) / 100
  return Math.min(LINE_MAX, Math.max(LINE_MIN, t))
}

function prefsFromUser(u: AuthUser | null): CardFontPrefs | null {
  if (!u?.writeCardFontFamily || !isFontKey(u.writeCardFontFamily)) return null
  const size = typeof u.writeCardFontSize === 'number' ? u.writeCardFontSize : WRITE_CARD_SIZE_DEFAULT
  const line = typeof u.writeCardLineHeight === 'number' ? u.writeCardLineHeight : WRITE_CARD_LINE_DEFAULT
  return {
    font: u.writeCardFontFamily,
    size: clampSize(size),
    line: clampLine(line),
  }
}

/** Typeface for verse cards on the write page. Account wins when signed in; device cache otherwise. */
export function useWriteCardFont() {
  const { user, isLoggedIn } = useAuth()

  const fontKey = useState<ReaderFontKey>('write-card-font', () => WRITE_CARD_FONT_DEFAULT)
  const fontSizePx = useState<number>('write-card-size', () => WRITE_CARD_SIZE_DEFAULT)
  const lineHeight = useState<number>('write-card-line', () => WRITE_CARD_LINE_DEFAULT)
  const hydrated = useState('write-card-font-ready', () => false)

  const fontFamilyCss = computed(() => READER_FONT_STACKS[fontKey.value])

  const cardStyle = computed(() => ({
    '--write-card-font': fontFamilyCss.value,
    '--write-card-size': `${fontSizePx.value}px`,
    '--write-card-line': String(lineHeight.value),
  }))

  function storageSuffix() {
    return user.value?.id ? `:${user.value.id}` : ''
  }

  function readLocal(suffix = storageSuffix()): CardFontPrefs | null {
    if (!import.meta.client) return null
    const rf = localStorage.getItem(LS_FONT + suffix)
    const rs = localStorage.getItem(LS_SIZE + suffix)
    const rl = localStorage.getItem(LS_LINE + suffix)
    if (!rf && !rs && !rl) return null
    const size = rs ? parseInt(rs, 10) : NaN
    const line = rl ? parseFloat(rl) : NaN
    return {
      font: rf && isFontKey(rf) ? rf : WRITE_CARD_FONT_DEFAULT,
      size: Number.isFinite(size) ? clampSize(size) : WRITE_CARD_SIZE_DEFAULT,
      line: Number.isFinite(line) ? clampLine(line) : WRITE_CARD_LINE_DEFAULT,
    }
  }

  function writeLocal() {
    if (!import.meta.client) return
    const suffix = storageSuffix()
    localStorage.setItem(LS_FONT + suffix, fontKey.value)
    localStorage.setItem(LS_SIZE + suffix, String(fontSizePx.value))
    localStorage.setItem(LS_LINE + suffix, String(lineHeight.value))
  }

  let applying = false

  function assign(prefs: CardFontPrefs) {
    applying = true
    fontKey.value = prefs.font
    fontSizePx.value = prefs.size
    lineHeight.value = prefs.line
    applying = false
  }

  function applyFromUserOrLocal() {
    const fromUser = prefsFromUser(user.value)
    if (fromUser) {
      assign(fromUser)
      if (import.meta.client && hydrated.value) writeLocal()
      return
    }
    const loc = readLocal() ?? (user.value?.id ? readLocal('') : null)
    assign(loc ?? {
      font: WRITE_CARD_FONT_DEFAULT,
      size: WRITE_CARD_SIZE_DEFAULT,
      line: WRITE_CARD_LINE_DEFAULT,
    })
    if (import.meta.client && hydrated.value) writeLocal()
  }

  watch(
    () =>
      [
        user.value?.id,
        user.value?.writeCardFontFamily,
        user.value?.writeCardFontSize,
        user.value?.writeCardLineHeight,
      ] as const,
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
          writeCardFontFamily: fontKey.value,
          writeCardFontSize: fontSizePx.value,
          writeCardLineHeight: lineHeight.value,
        },
      })
      if (user.value) {
        user.value = {
          ...user.value,
          writeCardFontFamily: fontKey.value,
          writeCardFontSize: fontSizePx.value,
          writeCardLineHeight: lineHeight.value,
        }
      }
    } catch {
      /* ignore */
    }
  }

  function persist() {
    if (!import.meta.client || !hydrated.value || applying) return
    writeLocal()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      void saveToAccount()
    }, 450)
  }

  onMounted(() => {
    if (hydrated.value) return
    applyFromUserOrLocal()
    hydrated.value = true
  })

  watch([fontKey, fontSizePx, lineHeight], persist, { flush: 'sync' })

  function decSize() {
    fontSizePx.value = clampSize(fontSizePx.value - 1)
  }

  function incSize() {
    fontSizePx.value = clampSize(fontSizePx.value + 1)
  }

  function decLine() {
    lineHeight.value = clampLine(lineHeight.value - LINE_STEP)
  }

  function incLine() {
    lineHeight.value = clampLine(lineHeight.value + LINE_STEP)
  }

  return {
    fontKey,
    fontSizePx,
    lineHeight,
    fontFamilyCss,
    cardStyle,
    decSize,
    incSize,
    decLine,
    incLine,
    sizeAtMin: computed(() => fontSizePx.value <= SIZE_MIN),
    sizeAtMax: computed(() => fontSizePx.value >= SIZE_MAX),
    lineAtMin: computed(() => lineHeight.value <= LINE_MIN),
    lineAtMax: computed(() => lineHeight.value >= LINE_MAX),
  }
}
