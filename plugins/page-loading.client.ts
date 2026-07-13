/** Full-screen loading overlay during client-side route changes. */
export default defineNuxtPlugin((nuxtApp) => {
  const isLoading = useState('page-loading', () => false)
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let isFirstNavigation = true

  const clearShowTimer = () => {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  const startLoading = () => {
    clearShowTimer()
    showTimer = setTimeout(() => {
      isLoading.value = true
      showTimer = null
    }, 120)
  }

  const stopLoading = () => {
    clearShowTimer()
    isLoading.value = false
  }

  nuxtApp.hook('page:start', (to, from) => {
    if (isFirstNavigation) return
    // Query-only updates on the same page (e.g. carousel ?slug=) must not remount the overlay.
    if (from && to && from.path === to.path) return
    startLoading()
  })

  nuxtApp.hook('page:finish', () => {
    isFirstNavigation = false
    stopLoading()
  })
  nuxtApp.hook('page:error', stopLoading)
  nuxtApp.hook('app:error', stopLoading)
})
