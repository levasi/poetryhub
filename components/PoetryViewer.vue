<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'
import { useAuth } from '~/composables/useAuth'

const { t, te } = useI18n()
const { labelForTag } = useTagLabel()
const { isLoggedIn } = useAuth()

const props = defineProps<{ poem: Poem }>()

const {
  fontKey,
  fontSizePx,
  poemBodyStyle,
  stanzaSlideStyle,
  onReaderPreferenceChange,
  fontOptions,
} = useReaderPreferences()

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
const slideMode    = ref(false)
const currentSlide = ref(0)

function nextSlide() { if (currentSlide.value < stanzas.value.length - 1) currentSlide.value++ }
function prevSlide() { if (currentSlide.value > 0) currentSlide.value-- }

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (!slideMode.value) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide()
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevSlide()
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
  if (code === 'en') return null
  const key = `lang.${code}`
  return te(key) ? t(key) : code.toUpperCase()
})
</script>

<template>
  <div>
    <!-- Reading progress bar -->
    <div class="fixed left-0 top-0 z-50 h-0.5 w-full bg-ink-200/80 pointer-events-none">
      <div
        class="h-full bg-gold-500 transition-all duration-100"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <!-- ── Standard reading view ──────────────────────────────────────────── -->
    <div v-if="!slideMode" class="animate-fade-in">
      <!-- Tags row -->
      <div v-if="tags.length" class="mb-8 flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.id"
          :to="`/poems?tag=${tag.slug}`"
          class="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs text-ink-600 shadow-sm transition-colors hover:border-gold-400/60 hover:text-gold-800"
        >
          {{ labelForTag(tag.slug, tag.name) }}
        </NuxtLink>
        <span
          v-if="langLabel"
          class="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs text-ink-600"
        >
          {{ langLabel }}
        </span>
      </div>

      <!-- Title -->
      <h1 class="mb-3 font-serif text-4xl font-bold leading-tight tracking-tight text-ink-900 md:text-5xl lg:text-6xl">
        {{ poem.title }}
      </h1>

      <!-- Author -->
      <NuxtLink
        v-if="author"
        :to="`/authors/${author.slug}`"
        class="inline-flex items-center gap-3 text-base text-ink-600 transition-colors hover:text-gold-800"
      >
        <img
          :src="authorAvatar"
          alt=""
          loading="lazy"
          class="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-ink-200/80"
        />
        <span>— {{ author.name }}</span>
      </NuxtLink>

      <!-- Ornament divider -->
      <div class="my-10 flex items-center gap-4">
        <div class="h-px flex-1 bg-ink-200" />
        <span class="text-xl text-ink-400">✦</span>
        <div class="h-px flex-1 bg-ink-200" />
      </div>

      <!-- Reading display (font + size) -->
      <div
        class="mb-8 rounded-xl border border-ink-200/90 bg-gradient-to-br from-white to-ink-50/80 px-4 py-3 shadow-sm sm:px-5"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-500">
          {{ t('viewer.readingDisplay') }}
        </p>
        <div class="flex flex-wrap items-end gap-4 sm:gap-6">
          <div class="min-w-[10rem] flex-1 sm:max-w-xs">
            <label class="mb-1 block text-xs font-medium text-ink-600" for="reader-font">{{ t('viewer.font') }}</label>
            <select
              id="reader-font"
              v-model="fontKey"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/40"
              @change="onReaderPreferenceChange"
            >
              <option
                v-for="f in fontOptions"
                :key="f"
                :value="f"
              >
                {{ f === 'playfair' ? t('viewer.fontPlayfair') : f === 'georgia' ? t('viewer.fontGeorgia') : f === 'inter' ? t('viewer.fontInter') : t('viewer.fontLora') }}
              </option>
            </select>
          </div>
          <div class="min-w-[12rem] flex-1 sm:max-w-sm">
            <label class="mb-1 block text-xs font-medium text-ink-600" for="reader-size">
              {{ t('viewer.fontSize') }} <span class="tabular-nums text-ink-500">({{ fontSizePx }}px)</span>
            </label>
            <input
              id="reader-size"
              v-model.number="fontSizePx"
              type="range"
              min="14"
              max="28"
              step="1"
              class="h-2 w-full cursor-pointer accent-gold-600"
              @input="onReaderPreferenceChange"
            />
          </div>
        </div>
        <p class="mt-3 text-xs text-ink-500">
          {{ isLoggedIn ? t('viewer.prefsSavedHint') : t('viewer.prefsLocalHint') }}
        </p>
      </div>

      <!-- Poem body -->
      <div class="poem-body w-full">
        <p
          v-for="(stanza, i) in stanzas"
          :key="i"
          class="mb-10 last:mb-0"
          :style="poemBodyStyle"
        >{{ stanza }}</p>
      </div>

      <!-- Actions bar -->
      <div class="mt-14 flex w-full flex-wrap items-center gap-3 border-t border-ink-200 pt-8">
        <button
          class="flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition-all"
          :class="liked
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-ink-200 bg-white text-ink-600 shadow-sm hover:border-rose-300 hover:text-rose-700'"
          @click="toggle(poem.id)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ liked ? t('viewer.saved') : t('viewer.savePoem') }}
        </button>

        <button
          v-if="stanzas.length > 1"
          class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2 text-sm text-ink-600 shadow-sm transition-all hover:border-gold-400 hover:text-gold-900"
          @click="slideMode = true; currentSlide = 0"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
          </svg>
          {{ t('viewer.stanzaView') }}
        </button>

        <span v-if="readingTimeLabel" class="ml-auto text-xs text-ink-500">
          {{ readingTimeLabel }}
        </span>
      </div>
    </div>

    <!-- ── Carousel / Slide mode ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="slide-overlay">
        <div
          v-if="slideMode"
          class="fixed inset-0 z-50 flex flex-col bg-ink-50"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-ink-200 bg-white/90 px-6 py-4 backdrop-blur-md">
            <div class="flex min-w-0 items-center gap-3">
              <img
                :src="authorAvatar"
                alt=""
                class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
              />
              <div class="min-w-0">
                <p class="truncate font-serif text-sm font-bold text-ink-800">{{ poem.title }}</p>
                <p class="truncate text-xs text-ink-500">{{ author?.name }}</p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
              :aria-label="t('a11y.closeStanza')"
              @click="slideMode = false"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Slide content -->
          <div class="flex flex-1 items-center justify-center px-8 py-12">
            <Transition name="stanza" mode="out-in">
              <p
                :key="currentSlide"
                class="w-full text-center"
                :style="stanzaSlideStyle"
              >{{ stanzas[currentSlide] }}</p>
            </Transition>
          </div>

          <!-- Nav -->
          <div class="flex items-center justify-center gap-6 border-t border-ink-200 bg-white/80 py-6 backdrop-blur-sm">
            <button
              class="rounded-full border border-ink-200 bg-white p-3 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-25"
              :disabled="currentSlide === 0"
              @click="prevSlide"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1.5">
              <button
                v-for="(_, i) in stanzas"
                :key="i"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="i === currentSlide ? 'w-6 bg-gold-500' : 'w-1.5 bg-ink-300 hover:bg-ink-400'"
                @click="currentSlide = i"
              />
            </div>

            <button
              class="rounded-full border border-ink-200 bg-white p-3 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-25"
              :disabled="currentSlide === stanzas.length - 1"
              @click="nextSlide"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p class="pb-4 text-center text-xs text-ink-500">
            {{ t('viewer.slideHint', { current: currentSlide + 1, total: stanzas.length }) }}
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-overlay-enter-active,
.slide-overlay-leave-active { transition: opacity 0.25s ease; }
.slide-overlay-enter-from,
.slide-overlay-leave-to    { opacity: 0; }

.stanza-enter-active,
.stanza-leave-active { transition: all 0.3s ease; }
.stanza-enter-from   { opacity: 0; transform: translateX(20px); }
.stanza-leave-to     { opacity: 0; transform: translateX(-20px); }
</style>
