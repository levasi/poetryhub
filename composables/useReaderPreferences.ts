import type { AuthUser } from '~/composables/useAuth'

export type ReaderFontKey = 'playfair' | 'georgia' | 'inter' | 'lora'

const LS_FONT = 'ph_reader_font'
const LS_SIZE = 'ph_reader_size'

/** CSS font-family stacks (Google fonts loaded in nuxt.config). */
export const READER_FONT_STACKS: Record<ReaderFontKey, string> = {
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "'Inter', system-ui, sans-serif",
  lora: "'Lora', Georgia, serif",
}

function isFontKey(v: string): v is ReaderFontKey {
  return v in READER_FONT_STACKS
}

function prefsFromUser(u: AuthUser | null): { font: ReaderFontKey; size: number } | null {
  if (!u || !('poemFontFamily' in u) || !u.poemFontFamily) return null
  if (!isFontKey(u.poemFontFamily)) return null
  const size = typeof u.poemFontSize === 'number' ? u.poemFontSize : 19
  return { font: u.poemFontFamily, size: Math.min(28, Math.max(14, size)) }
}

export function useReaderPreferences() {
  const { user, isLoggedIn } = useAuth()

  const fontKey = ref<ReaderFontKey>('playfair')
  const fontSizePx = ref(19)

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
      size: Number.isFinite(size) && size >= 14 && size <= 28 ? size : 19,
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

  const poemBodyStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `${fontSizePx.value}px`,
    lineHeight: 1.95,
    color: '#2d2d26',
    letterSpacing: '0.02em',
  }))

  const stanzaSlideStyle = computed(() => ({
    whiteSpace: 'pre-wrap' as const,
    fontFamily: fontFamilyCss.value,
    fontSize: `clamp(${Math.max(14, fontSizePx.value - 2)}px, 3vw, ${fontSizePx.value + 4}px)`,
    lineHeight: 2.05,
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
    fontOptions: ['playfair', 'georgia', 'inter', 'lora'] as const,
  }
}
