<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

type SlideExpose = {
  getScrollEdges: () => { atTop: boolean; atBottom: boolean; canScroll: boolean }
  resetScroll: () => void
}

const props = defineProps<{
  poems: Poem[]
  pending?: boolean
  loadingMore?: boolean
  hasMore?: boolean
}>()

const emit = defineEmits<{
  'load-more': []
}>()

const { t } = useI18n()
const { sideActionsVisible, toggleSideActions } = useReelChrome()

const rootRef = ref<HTMLElement | null>(null)
const slideRefs = ref<Record<number, SlideExpose | null>>({})
const activeIndex = ref(0)
const viewportH = ref(0)
const dragOffset = ref(0)
const isDragging = ref(false)
const isAnimating = ref(false)

/** Once set for a gesture: scroll poem body vs change slide. */
const gestureMode = ref<'content' | 'slide' | null>(null)

const touchStartY = ref<number | null>(null)
const touchStartX = ref<number | null>(null)
const lastTouchY = ref<number | null>(null)

const trackStyle = computed(() => {
  const y = -(activeIndex.value * viewportH.value) + dragOffset.value
  return {
    transform: `translate3d(0, ${y}px, 0)`,
    transition: isDragging.value || !viewportH.value ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  }
})

function setSlideRef(index: number, el: unknown) {
  if (!el) {
    delete slideRefs.value[index]
    return
  }
  slideRefs.value[index] = el as SlideExpose
}

function activeEdges() {
  return (
    slideRefs.value[activeIndex.value]?.getScrollEdges() ?? {
      atTop: true,
      atBottom: true,
      canScroll: false,
    }
  )
}

function measure() {
  const root = rootRef.value
  if (!root) return
  viewportH.value = root.clientHeight
}

function goNext() {
  if (activeIndex.value >= props.poems.length - 1) {
    if (props.hasMore) emit('load-more')
    return
  }
  isAnimating.value = true
  activeIndex.value += 1
  window.setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

function goPrev() {
  if (activeIndex.value <= 0) return
  isAnimating.value = true
  activeIndex.value -= 1
  window.setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

function onTouchStart(e: TouchEvent) {
  if (isAnimating.value || !viewportH.value) return
  const t0 = e.touches[0]
  if (!t0) return
  touchStartY.value = t0.clientY
  touchStartX.value = t0.clientX
  lastTouchY.value = t0.clientY
  gestureMode.value = null
  isDragging.value = false
  dragOffset.value = 0
}

function onTouchMove(e: TouchEvent) {
  if (touchStartY.value == null || touchStartX.value == null) return
  const t0 = e.touches[0]
  if (!t0) return
  const dy = t0.clientY - touchStartY.value
  const dx = t0.clientX - touchStartX.value
  if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
  if (Math.abs(dy) <= Math.abs(dx)) return

  if (gestureMode.value == null) {
    const edges = activeEdges()
    // Finger up (dy < 0) at poem end → next slide; finger down at start → prev
    if (!edges.canScroll) {
      gestureMode.value = 'slide'
    } else if (dy < 0 && edges.atBottom) {
      gestureMode.value = 'slide'
    } else if (dy > 0 && edges.atTop) {
      gestureMode.value = 'slide'
    } else {
      gestureMode.value = 'content'
    }
  }

  if (gestureMode.value === 'content') {
    const edges = activeEdges()
    const frameDy = lastTouchY.value == null ? 0 : t0.clientY - lastTouchY.value
    lastTouchY.value = t0.clientY
    // Only hand off when user keeps pushing past the poem edge
    if (frameDy < -6 && edges.atBottom) {
      gestureMode.value = 'slide'
      touchStartY.value = t0.clientY
      isDragging.value = true
      dragOffset.value = 0
      e.preventDefault()
      return
    }
    if (frameDy > 6 && edges.atTop) {
      gestureMode.value = 'slide'
      touchStartY.value = t0.clientY
      isDragging.value = true
      dragOffset.value = 0
      e.preventDefault()
      return
    }
    isDragging.value = false
    dragOffset.value = 0
    return
  }

  lastTouchY.value = t0.clientY

  e.preventDefault()
  isDragging.value = true

  const atFeedStart = activeIndex.value <= 0 && dy > 0
  const atFeedEnd = activeIndex.value >= props.poems.length - 1 && dy < 0
  dragOffset.value = atFeedStart || atFeedEnd ? dy * 0.35 : dy
}

function onTouchEnd() {
  const dy = dragOffset.value
  const mode = gestureMode.value
  isDragging.value = false
  dragOffset.value = 0
  gestureMode.value = null
  touchStartY.value = null
  touchStartX.value = null
  lastTouchY.value = null

  if (mode !== 'slide') return

  const threshold = Math.min(80, viewportH.value * 0.18)
  if (dy < -threshold) goNext()
  else if (dy > threshold) goPrev()
}

watch(activeIndex, (i) => {
  nextTick(() => slideRefs.value[i]?.resetScroll())
  if (!props.hasMore || props.loadingMore) return
  if (props.poems.length === 0) return
  if (i >= props.poems.length - 2) emit('load-more')
})

let ro: ResizeObserver | null = null

onMounted(() => {
  measure()
  ro = new ResizeObserver(() => measure())
  if (rootRef.value) ro.observe(rootRef.value)

  const root = rootRef.value
  root?.addEventListener('touchstart', onTouchStart, { passive: true })
  root?.addEventListener('touchmove', onTouchMove, { passive: false })
  root?.addEventListener('touchend', onTouchEnd, { passive: true })
  root?.addEventListener('touchcancel', onTouchEnd, { passive: true })

  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  ro?.disconnect()
  const root = rootRef.value
  root?.removeEventListener('touchstart', onTouchStart)
  root?.removeEventListener('touchmove', onTouchMove)
  root?.removeEventListener('touchend', onTouchEnd)
  root?.removeEventListener('touchcancel', onTouchEnd)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    ref="rootRef"
    class="fixed inset-x-0 top-14 z-20 overflow-hidden md:hidden"
    style="bottom: calc(3.25rem + env(safe-area-inset-bottom, 0px));"
    role="feed"
    :aria-label="t('home.reelsFeedAria')"
    tabindex="0"
    @keydown.down.prevent="goNext"
    @keydown.up.prevent="goPrev"
  >
    <div
      v-if="pending && !poems.length"
      class="flex h-full items-center justify-center"
    >
      <span
        class="h-9 w-9 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
        aria-hidden="true"
      />
    </div>

    <DsEmpty
      v-else-if="!poems.length"
      class="flex h-full items-center justify-center px-6"
      :title="t('home.emptyLibrary')"
    />

    <div
      v-else
      class="poem-reels-track will-change-transform"
      :style="trackStyle"
    >
      <div
        v-for="(poem, i) in poems"
        :key="poem.id"
        class="overflow-hidden"
        :style="viewportH ? { height: `${viewportH}px` } : { height: '100vh' }"
        :aria-hidden="i !== activeIndex"
      >
        <PoemReelSlide
          :ref="(el) => setSlideRef(i, el)"
          :poem="poem"
          :active="i === activeIndex"
        />
      </div>
    </div>

    <p
      v-if="loadingMore"
      class="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-ui-xs text-content-soft"
    >
      {{ t('home.loadingMore') }}
    </p>

    <!-- Instagram-style more (⋮) — Citește only; toggles side actions -->
    <button
      v-if="poems.length"
      type="button"
      class="absolute bottom-3 right-1.5 z-30 flex h-11 w-11 items-center justify-center rounded-full text-content transition-colors"
      :class="sideActionsVisible ? 'text-brand' : 'text-content'"
      :aria-pressed="sideActionsVisible"
      :aria-label="sideActionsVisible ? t('nav.reelActionsHide') : t('nav.reelActionsShow')"
      @click.stop="toggleSideActions"
    >
      <svg
        class="h-6 w-6"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="1.75" />
        <circle cx="12" cy="12" r="1.75" />
        <circle cx="12" cy="19" r="1.75" />
      </svg>
    </button>
  </div>
</template>
