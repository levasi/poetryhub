<script setup lang="ts">
import gsap from 'gsap'
import { Icon } from '@iconify/vue'
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'
import { authorAvatarUrl } from '~/utils/authorAvatar'

const props = defineProps<{
  poem: Poem
  /** When true, this slide is the active viewport — prefer loading images. */
  active?: boolean
}>()

const { t } = useI18n()
const { poemBodyStyle } = useReaderPreferences()
const { toggle, isFavorite } = useFavorites()
const { sideActionsVisible } = useReelChrome()

const liked = computed(() => isFavorite(props.poem.id))
const author = computed(() => props.poem.author)
const avatarSrc = computed(() => (author.value ? authorAvatarUrl(author.value) : ''))

const poemHref = computed(() => {
  const s = author.value?.slug
  if (s) return { path: `/authors/${s}`, query: { poem: props.poem.slug } }
  return `/poems/${props.poem.slug}`
})

const authorHref = computed(() =>
  author.value?.slug ? `/authors/${author.value.slug}` : null,
)

const copied = ref(false)
const bodyRef = ref<HTMLElement | null>(null)
const actionsRef = ref<HTMLElement | null>(null)
let actionsTween: gsap.core.Tween | null = null

function getScrollEdges() {
  const el = bodyRef.value
  if (!el) return { atTop: true, atBottom: true, canScroll: false }
  const maxScroll = el.scrollHeight - el.clientHeight
  const canScroll = maxScroll > 2
  const atTop = el.scrollTop <= 2
  const atBottom = el.scrollTop >= maxScroll - 2
  return { atTop, atBottom, canScroll }
}

function resetScroll() {
  if (bodyRef.value) bodyRef.value.scrollTop = 0
}

defineExpose({ getScrollEdges, resetScroll })

function actionEls() {
  const root = actionsRef.value
  if (!root) return [] as HTMLElement[]
  return gsap.utils.toArray<HTMLElement>(':scope > *', root)
}

function setActionsImmediate(visible: boolean) {
  const els = actionEls()
  if (!els.length) return
  actionsTween?.kill()
  gsap.set(els, {
    autoAlpha: visible ? 1 : 0,
    y: visible ? 0 : -24,
  })
}

function animateActions(visible: boolean) {
  const els = actionEls()
  if (!els.length) return
  actionsTween?.kill()

  if (visible) {
    // Top → bottom: first button drops in first
    gsap.set(els, { autoAlpha: 0, y: -24 })
    actionsTween = gsap.to(els, {
      autoAlpha: 1,
      y: 0,
      duration: 0.38,
      stagger: 0.08,
      ease: 'power2.out',
      overwrite: true,
    })
    return
  }

  // Top → bottom exit as well
  actionsTween = gsap.to(els, {
    autoAlpha: 0,
    y: -24,
    duration: 0.28,
    stagger: 0.06,
    ease: 'power2.in',
    overwrite: true,
  })
}

watch(
  () => props.active,
  (active) => {
    if (active) nextTick(() => resetScroll())
  },
)

watch(
  sideActionsVisible,
  (visible) => {
    nextTick(() => {
      if (props.active) animateActions(visible)
      else setActionsImmediate(visible)
    })
  },
)

onMounted(() => {
  nextTick(() => setActionsImmediate(sideActionsVisible.value))
})

onBeforeUnmount(() => {
  actionsTween?.kill()
})

async function sharePoem() {
  const path = typeof poemHref.value === 'string'
    ? poemHref.value
    : `${poemHref.value.path}?poem=${poemHref.value.query.poem}`
  const url = `${window.location.origin}${path}`
  if (navigator.share) {
    try {
      await navigator.share({ title: props.poem.title, url })
      return
    } catch {
      // cancelled — fall through
    }
  }
  await navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <article class="relative flex h-full w-full flex-col overflow-hidden bg-surface-page" :aria-label="poem.title">
    <div ref="bodyRef"
      class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-8 pt-5"
      style="scrollbar-width: thin; -webkit-overflow-scrolling: touch;">
      <header class="mb-5">
        <NuxtLink v-if="author" :to="authorHref || undefined" class="mb-4 flex items-center gap-3">
          <img v-if="avatarSrc" :src="avatarSrc" :alt="author.name" width="40" height="40"
            class="h-10 w-10 rounded-full object-cover ring-2 ring-edge-subtle" :loading="active ? 'eager' : 'lazy'">
          <div class="min-w-0">
            <p class="truncate font-serif text-sm font-semibold text-content">
              {{ author.name }}
            </p>
          </div>
        </NuxtLink>
        <h2 class="font-serif text-2xl font-semibold tracking-tight text-content">
          {{ poem.title }}
        </h2>
      </header>

      <div class="whitespace-pre-wrap text-content" :style="poemBodyStyle">
        {{ poem.content }}
      </div>
    </div>

    <!-- Side actions (IG / TikTok style) — GSAP stagger on toggle; leave room for ⋮ -->
    <div ref="actionsRef"
      class="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 flex-col items-center justify-end gap-4 pb-16 pr-2"
      :aria-hidden="!sideActionsVisible">
      <button type="button" class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :tabindex="sideActionsVisible ? 0 : -1" :aria-label="liked ? t('viewer.saved') : t('viewer.savePoem')"
        @click="toggle(poem.id)">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 shadow-ds-card backdrop-blur-sm"
          :class="liked ? 'text-brand' : 'text-content-secondary'">
          <Icon
            :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
            class="h-6 w-6"
            aria-hidden="true"
          />
        </span>
      </button>

      <button type="button" class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :tabindex="sideActionsVisible ? 0 : -1" :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="sharePoem">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 text-content-secondary shadow-ds-card backdrop-blur-sm">
          <Icon icon="heroicons:share" class="h-5 w-5" aria-hidden="true" />
        </span>
      </button>

      <NuxtLink :to="poemHref" class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :tabindex="sideActionsVisible ? 0 : -1" :aria-label="t('home.continueReading')">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 text-content-secondary shadow-ds-card backdrop-blur-sm">
          <Icon icon="heroicons:arrow-top-right-on-square" class="h-5 w-5" aria-hidden="true" />
        </span>
      </NuxtLink>
    </div>
  </article>
</template>
