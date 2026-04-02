<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'
import { useAuth } from '~/composables/useAuth'

const { t, te } = useI18n()
const { labelForTag } = useTagLabel()
const { isLoggedIn } = useAuth()

const props = defineProps<{ poem: Poem }>()

const { poemBodyStyle, stanzaSlideStyle } = useReaderPreferences()

const readerSettingsOpen = ref(false)

const author = computed(() => props.poem.author)
const authorAvatar = computed(() => authorAvatarUrl(author.value))

const { toggle, isFavorite } = useFavorites()
const liked = computed(() => isFavorite(props.poem.id))

// ── Stanzas ──────────────────────────────────────────────────────────────────
const stanzas = computed(() =>
  props.poem.content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean),
)

// ── Reading progress ─────────────────────────────────────────────────────────
const progress = ref(0)
onMounted(() => {
  const onScroll = () => {
    const el = document.documentElement
    const scrolled = el.scrollTop
    const total = el.scrollHeight - el.clientHeight
    progress.value = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
})

// ── Carousel / slide mode ────────────────────────────────────────────────────
const slideMode = ref(false)
const currentSlide = ref(0)

function nextSlide() { if (currentSlide.value < stanzas.value.length - 1) currentSlide.value++ }
function prevSlide() { if (currentSlide.value > 0) currentSlide.value-- }

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (!slideMode.value) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide()
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide()
    if (e.key === 'Escape') slideMode.value = false
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const tags = computed(() => props.poem.poemTags?.map((pt) => pt.tag) ?? [])

const readingTimeLabel = computed(() => {
  if (!props.poem.readingTime) return null
  const mins = Math.ceil(props.poem.readingTime / 60)
  return mins < 1 ? t('viewer.underMin') : t('viewer.minRead', { n: mins })
})

const langLabel = computed(() => {
  const code = props.poem.language
  if (!code || code === 'en' || code === 'ro') return null
  const key = `lang.${code}`
  return te(key) ? t(key) : code.toUpperCase()
})

const writtenContextLine = computed(() => {
  const y = props.poem.writtenYear
  const p = props.poem.writtenPeriod?.trim()
  if (y != null && p) return t('viewer.writtenYearAndPeriod', { year: y, period: p })
  if (y != null) return t('viewer.writtenInYear', { year: y })
  if (p) return p
  return null
})
</script>

<template>
  <div>
    <!-- Reading progress bar -->
    <div class="fixed left-0 top-0 z-50 h-0.5 w-full bg-edge-subtle pointer-events-none">
      <div class="h-full bg-brand transition-all duration-100" :style="{ width: `${progress}%` }" />
    </div>

    <!-- Fixed cog: reading appearance (font + size) -->
    <button
      v-if="!slideMode"
      type="button"
      class="fixed right-3 top-1/2 z-[45] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-surface-raised/95 text-content-secondary shadow-md backdrop-blur-sm transition hover:border-brand/50 hover:text-brand md:right-6"
      :aria-label="t('viewer.openReadingSettings')"
      @click="readerSettingsOpen = true"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <ReaderSettingsSidebar v-model:open="readerSettingsOpen" id-prefix="poem-pdp" />

    <!-- ── Standard reading view ──────────────────────────────────────────── -->
    <div v-if="!slideMode" class="animate-fade-in">
      <!-- Tags row -->
      <div v-if="tags.length" class="mb-8 flex flex-wrap gap-2">
        <NuxtLink v-for="tag in tags" :key="tag.id" :to="`/poems?tag=${tag.slug}`"
          class="rounded-full border border-edge bg-surface-raised/90 px-3 py-1 text-xs text-content-secondary shadow-sm transition-colors hover:border-brand/50 hover:text-brand">
          {{ labelForTag(tag.slug, tag.name) }}
        </NuxtLink>
        <span v-if="langLabel" class="rounded-full border border-edge bg-surface-raised/90 px-3 py-1 text-xs text-content-secondary">
          {{ langLabel }}
        </span>
      </div>

      <!-- Title -->
      <PoemTitle :title="poem.title" :slug="poem.slug" variant="pdp" />

      <!-- Author -->
      <NuxtLink v-if="author" :to="`/authors/${author.slug}`"
        class="inline-flex items-center gap-3 text-base text-content-secondary transition-colors hover:text-brand">
        <img :src="authorAvatar" alt="" loading="lazy"
          class="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-edge" />
        <span>— {{ author.name }}</span>
      </NuxtLink>

      <p v-if="writtenContextLine" class="mt-3 text-sm text-content-muted">
        {{ writtenContextLine }}
      </p>

      <!-- Ornament divider -->
      <div class="my-10 flex items-center gap-4">
        <div class="h-px flex-1 bg-edge" />
        <span class="text-xl text-content-soft">✦</span>
        <div class="h-px flex-1 bg-edge" />
      </div>

      <!-- Poem body -->
      <div class="poem-body w-full">
        <p v-for="(stanza, i) in stanzas" :key="i" :style="poemBodyStyle">{{ stanza }}</p>
      </div>

      <!-- Actions bar -->
      <div class="mt-14 flex w-full flex-wrap items-center gap-3 border-t border-edge pt-8">
        <button class="flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition-all" :class="liked
          ? 'border-rose-300 bg-rose-50 text-rose-700'
          : 'border-edge bg-surface-raised text-content-secondary shadow-sm hover:border-rose-300 hover:text-rose-700'"
          @click="toggle(poem.id)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ liked ? t('viewer.saved') : t('viewer.savePoem') }}
        </button>

        <button v-if="stanzas.length > 1"
          class="flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-5 py-2 text-sm text-content-secondary shadow-sm transition-all hover:border-brand/50 hover:text-brand"
          @click="slideMode = true; currentSlide = 0">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
          </svg>
          {{ t('viewer.stanzaView') }}
        </button>

        <span v-if="readingTimeLabel" class="ml-auto text-xs text-content-muted">
          {{ readingTimeLabel }}
        </span>
      </div>
    </div>

    <!-- ── Carousel / Slide mode ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="slide-overlay">
        <div v-if="slideMode" class="fixed inset-0 z-50 flex flex-col bg-surface-page">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-edge bg-surface-raised/95 px-6 py-4 backdrop-blur-md">
            <div class="flex min-w-0 items-center gap-3">
              <img :src="authorAvatar" alt="" class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-edge" />
              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-2">
                  <p class="min-w-0 flex-1 truncate font-serif text-sm font-bold text-content">{{ poem.title }}</p>
                  <PoemCarouselIcon :slug="poem.slug" size="sm" class="shrink-0" />
                </div>
                <p class="truncate text-xs text-content-muted">{{ author?.name }}</p>
              </div>
            </div>
            <button type="button"
              class="rounded-full border border-edge bg-surface-raised p-2 text-content-secondary transition-colors hover:border-edge-strong hover:text-content"
              :aria-label="t('a11y.closeStanza')" @click="slideMode = false">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Slide content -->
          <div class="flex flex-1 items-center justify-center px-8 py-12">
            <Transition name="stanza" mode="out-in">
              <p :key="currentSlide" class="w-full text-center" :style="stanzaSlideStyle">{{ stanzas[currentSlide] }}
              </p>
            </Transition>
          </div>

          <!-- Nav -->
          <div class="flex items-center justify-center gap-6 border-t border-edge bg-surface-raised/90 py-6 backdrop-blur-sm">
            <button
              class="rounded-full border border-edge bg-surface-raised p-3 text-content-secondary transition-colors hover:border-edge-strong hover:text-content disabled:opacity-25"
              :disabled="currentSlide === 0" @click="prevSlide">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1.5">
              <button v-for="(_, i) in stanzas" :key="i" class="h-1.5 rounded-full transition-all duration-300"
                :class="i === currentSlide ? 'w-6 bg-brand' : 'w-1.5 bg-edge-strong hover:bg-content-soft'"
                @click="currentSlide = i" />
            </div>

            <button
              class="rounded-full border border-edge bg-surface-raised p-3 text-content-secondary transition-colors hover:border-edge-strong hover:text-content disabled:opacity-25"
              :disabled="currentSlide === stanzas.length - 1" @click="nextSlide">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p class="pb-4 text-center text-xs text-content-muted">
            {{ t('viewer.slideHint', { current: currentSlide + 1, total: stanzas.length }) }}
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-overlay-enter-active,
.slide-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.slide-overlay-enter-from,
.slide-overlay-leave-to {
  opacity: 0;
}

.stanza-enter-active,
.stanza-leave-active {
  transition: all 0.3s ease;
}

.stanza-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.stanza-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
