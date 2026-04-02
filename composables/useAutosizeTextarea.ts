import { nextTick, onMounted, onUnmounted, type Ref, watch } from 'vue'

/**
 * Keeps a textarea height in sync with its text (width changes included).
 */
export function useAutosizeTextarea(elRef: Ref<HTMLTextAreaElement | null>, valueRef: Ref<string>) {
  let resizeObserver: ResizeObserver | null = null

  function fit() {
    const el = elRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  onMounted(() => {
    nextTick(() => {
      fit()
      const el = elRef.value
      if (el && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => nextTick(fit))
        resizeObserver.observe(el)
      }
    })
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  watch(valueRef, () => nextTick(fit))

  return { fit }
}
