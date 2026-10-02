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
  <article
    class="poem-reel-slide"
    :aria-label="poem.title"
  >
    <div
      ref="bodyRef"
      class="poem-reel-slide__body"
    >
      <header class="poem-reel-slide__header">
        <NuxtLink
          v-if="author"
          :to="authorHref || undefined"
          class="poem-reel-slide__author"
        >
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :alt="author.name"
            width="40"
            height="40"
            class="poem-reel-slide__avatar"
            :loading="active ? 'eager' : 'lazy'"
          >
          <div class="poem-reel-slide__author-meta">
            <p class="poem-reel-slide__author-name">
              {{ author.name }}
            </p>
          </div>
        </NuxtLink>
        <h2 class="poem-reel-slide__title">
          <NuxtLink
            :to="poemHref"
            class="poem-reel-slide__title-link"
          >
            {{ poem.title }}
          </NuxtLink>
        </h2>
      </header>

      <div
        class="poem-reel-slide__content"
        :style="poemBodyStyle"
      >
        {{ poem.content }}
      </div>
    </div>

    <div
      ref="actionsRef"
      class="poem-reel-slide__actions"
      :aria-hidden="!sideActionsVisible"
    >
      <button
        type="button"
        class="poem-reel-slide__action"
        :tabindex="sideActionsVisible ? 0 : -1"
        :aria-label="liked ? t('viewer.saved') : t('viewer.savePoem')"
        @click="toggle(poem.id)"
      >
        <span
          class="poem-reel-slide__action-btn"
          :class="{ 'poem-reel-slide__action-btn--liked': liked }"
        >
          <Icon
            :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
            class="poem-reel-slide__action-icon"
            aria-hidden="true"
          />
        </span>
      </button>

      <button
        type="button"
        class="poem-reel-slide__action"
        :tabindex="sideActionsVisible ? 0 : -1"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="sharePoem"
      >
        <span class="poem-reel-slide__action-btn">
          <Icon
            icon="heroicons:share"
            class="poem-reel-slide__action-icon poem-reel-slide__action-icon--sm"
            aria-hidden="true"
          />
        </span>
      </button>

      <NuxtLink
        :to="poemHref"
        class="poem-reel-slide__action"
        :tabindex="sideActionsVisible ? 0 : -1"
        :aria-label="t('home.continueReading')"
      >
        <span class="poem-reel-slide__action-btn">
          <Icon
            icon="heroicons:arrow-top-right-on-square"
            class="poem-reel-slide__action-icon poem-reel-slide__action-icon--sm"
            aria-hidden="true"
          />
        </span>
      </NuxtLink>
    </div>
  </article>
</template>
