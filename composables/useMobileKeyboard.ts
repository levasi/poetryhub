/**
 * Detects virtual keyboard via visualViewport shrinkage (iOS/Android).
 * Shared through useState so layout + tab bar stay in sync.
 * Call `trackMobileKeyboard()` once from a long-lived component (e.g. AppMobileTabBar).
 */
export function useMobileKeyboard() {
  const keyboardOpen = useState('mobile-keyboard-open', () => false)
  return { keyboardOpen }
}

export function trackMobileKeyboard() {
  const { keyboardOpen } = useMobileKeyboard()

  onMounted(() => {
    const vv = window.visualViewport
    const update = () => {
      if (!vv) {
        keyboardOpen.value = false
        return
      }
      const covered = document.documentElement.clientHeight - vv.height
      keyboardOpen.value = covered > 120
    }

    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    update()

    onUnmounted(() => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      keyboardOpen.value = false
    })
  })
}
