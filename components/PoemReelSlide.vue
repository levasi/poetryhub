<script setup lang="ts">
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

watch(
  () => props.active,
  (active) => {
    if (active) nextTick(() => resetScroll())
  },
)

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
    class="relative flex h-full w-full flex-col overflow-hidden bg-surface-page"
    :aria-label="poem.title"
  >
    <div
      ref="bodyRef"
      class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-8 pt-5 pr-16"
      style="scrollbar-width: thin; -webkit-overflow-scrolling: touch;"
    >
      <header class="mb-5">
        <NuxtLink
          v-if="author"
          :to="authorHref || undefined"
          class="mb-4 flex items-center gap-3"
        >
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :alt="author.name"
            width="40"
            height="40"
            class="h-10 w-10 rounded-full object-cover ring-2 ring-edge-subtle"
            :loading="active ? 'eager' : 'lazy'"
          >
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

      <div
        class="whitespace-pre-wrap text-content"
        :style="poemBodyStyle"
      >
        {{ poem.content }}
      </div>
    </div>

    <!-- Side actions (IG / TikTok style) -->
    <div
      class="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 flex-col items-center justify-end gap-4 pb-8 pr-2"
    >
      <button
        type="button"
        class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :aria-label="liked ? t('viewer.saved') : t('viewer.savePoem')"
        @click="toggle(poem.id)"
      >
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 shadow-ds-card backdrop-blur-sm"
          :class="liked ? 'text-brand' : 'text-content-secondary'"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            :fill="liked ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </span>
      </button>

      <button
        type="button"
        class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="sharePoem"
      >
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 text-content-secondary shadow-ds-card backdrop-blur-sm"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </span>
      </button>

      <NuxtLink
        :to="poemHref"
        class="pointer-events-auto flex flex-col items-center gap-1 text-content"
        :aria-label="t('home.continueReading')"
      >
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 text-content-secondary shadow-ds-card backdrop-blur-sm"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </span>
      </NuxtLink>
    </div>
  </article>
</template>
