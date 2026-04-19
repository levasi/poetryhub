<script setup lang="ts">
import type { CarouselTheme } from '~/composables/useCarouselGenerator'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import CarouselFontSelect from '~/components/carousel/CarouselFontSelect.vue'
import type { CarouselSiteDefaultsPayload } from '~/utils/carouselSiteDefaults'
import {
  isCarouselSiteOwnerEmail,
  userCanManageCarouselDefaults,
} from '~/utils/carouselDefaultsAdmin'

/** Matches `scripts/seed.ts` placeholder poem (author slug + poem slug). */
const PLACEHOLDER_AUTHOR_SLUG = 'poetryhub'
const PLACEHOLDER_POEM_SLUG = 'titlu-exemplu-carousel'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
const config = useRuntimeConfig()
const { user, fetchMe } = useAdmin()

useSeoMeta({ title: computed(() => t('seo.adminInstaPost')) })

await fetchMe()

const runtimeEmail = config.public.carouselDefaultsAdminEmail as string | undefined

const isOwner = computed(() =>
  Boolean(user.value?.email && isCarouselSiteOwnerEmail(user.value.email, runtimeEmail)),
)

const canManageDefaults = computed(() =>
  user.value?.email
    ? userCanManageCarouselDefaults({ email: user.value.email, role: user.value.role }, runtimeEmail)
    : false,
)

const { data: defaults, refresh } = await useFetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults')

const theme = ref<CarouselTheme>('dark')
const carouselFontKey = ref<ReaderFontKey>('literata')
const linesPerSlide = ref(8)
const bodyFontSizeScale = ref(1.5)
const bodyLineHeight = ref(1.65)
const keywordLocal = ref('')
const ctaLocal = ref('')

watch(
  defaults,
  (d) => {
    if (!d) return
    theme.value = d.theme
    carouselFontKey.value = d.carouselFontKey as ReaderFontKey
    linesPerSlide.value = d.linesPerSlide
    bodyFontSizeScale.value = d.bodyFontSizeScale
    bodyLineHeight.value = d.bodyLineHeight
    keywordLocal.value = d.keywordInput
    ctaLocal.value = d.ctaText
  },
  { immediate: true },
)

const saving = ref(false)
const showSaved = ref(false)

function payloadFromForm(): CarouselSiteDefaultsPayload {
  const base = defaults.value
  const ctaOut =
    isOwner.value && base
      ? ctaLocal.value.trim()
      : (base?.ctaText ?? '').trim()
  return {
    theme: theme.value,
    carouselFontKey: carouselFontKey.value as CarouselSiteDefaultsPayload['carouselFontKey'],
    linesPerSlide: Math.min(16, Math.max(4, Math.round(Number(linesPerSlide.value)))),
    bodyFontSizeScale: bodyFontSizeScale.value,
    bodyLineHeight: bodyLineHeight.value,
    ctaText: ctaOut.slice(0, 500),
    keywordInput: keywordLocal.value.slice(0, 2000),
  }
}

async function save() {
  if (!defaults.value || !canManageDefaults.value) return
  saving.value = true
  showSaved.value = false
  try {
    await $fetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults', {
      method: 'PUT',
      body: payloadFromForm(),
    })
    await refresh()
    showSaved.value = true
    setTimeout(() => {
      showSaved.value = false
    }, 2500)
  } catch {
    alert(t('admin.instaPost.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-content">
    <p class="ds-eyebrow mb-2 text-content-soft">{{ t('admin.panel') }}</p>
    <h1 class="mb-3 font-serif text-3xl font-semibold tracking-tight text-content">
      {{ t('admin.instaPost.title') }}
    </h1>
    <p class="max-w-reading text-content-secondary">
      {{ t('admin.instaPost.lead') }}
    </p>

    <p class="mt-6 max-w-reading text-sm text-content-muted">
      {{ t('admin.instaPost.placeholderPoemIntro') }}
      <NuxtLink
        class="font-medium text-brand underline-offset-2 hover:underline"
        :to="{ path: `/authors/${PLACEHOLDER_AUTHOR_SLUG}`, query: { poem: PLACEHOLDER_POEM_SLUG } }"
      >
        {{ t('admin.instaPost.placeholderPoemLink') }}
      </NuxtLink>
    </p>

    <section
      v-if="canManageDefaults"
      class="mt-10 space-y-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card"
    >
      <div>
        <h2 class="mb-4 font-serif text-lg font-semibold text-content">
          {{ t('admin.instaPost.sectionCarouselDefaults') }}
        </h2>

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">{{
          t('carousel.fieldTheme')
        }}</label>
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            v-for="th in (['minimal', 'dark', 'gradient', 'neon'] as CarouselTheme[])"
            :key="th"
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition"
            :class="
              theme === th
                ? 'border-gold-500 bg-gold-500 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
            "
            @click="theme = th"
          >
            {{ t(`carousel.theme.${th}`) }}
          </button>
        </div>

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">{{
          t('carousel.fieldFont')
        }}</label>
        <CarouselFontSelect v-model="carouselFontKey" class="mb-6 max-w-md" />

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">{{
          t('carousel.fieldLinesPerSlide')
        }}</label>
        <div class="mb-6 flex max-w-md items-center gap-3">
          <input
            v-model.number="linesPerSlide"
            type="range"
            min="4"
            max="16"
            step="1"
            class="h-2 flex-1 cursor-pointer accent-gold-600"
          />
          <span class="w-10 text-right text-sm tabular-nums text-ink-600">{{ linesPerSlide }}</span>
        </div>

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">{{
          t('carousel.fieldBodyFontSize')
        }}</label>
        <div class="mb-6 flex max-w-md items-center gap-3">
          <input
            v-model.number="bodyFontSizeScale"
            type="range"
            min="0.7"
            max="2"
            step="0.05"
            class="h-2 flex-1 cursor-pointer accent-gold-600"
          />
          <span class="w-12 text-right text-sm tabular-nums text-ink-600">{{ Math.round(bodyFontSizeScale * 100)
          }}%</span>
        </div>

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">{{
          t('carousel.fieldLineHeight')
        }}</label>
        <div class="mb-6 flex max-w-md items-center gap-3">
          <input
            v-model.number="bodyLineHeight"
            type="range"
            min="1.15"
            max="2.25"
            step="0.05"
            class="h-2 flex-1 cursor-pointer accent-gold-600"
          />
          <span class="w-12 text-right text-sm tabular-nums text-ink-600">{{ bodyLineHeight.toFixed(2) }}</span>
        </div>

        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500" for="insta-keywords">{{
          t('carousel.fieldKeywords')
        }}</label>
        <input
          id="insta-keywords"
          v-model="keywordLocal"
          type="text"
          maxlength="2000"
          class="mb-2 w-full max-w-lg rounded-ds-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-500"
          :placeholder="t('carousel.phKeywords')"
        />
        <p class="mb-6 max-w-reading text-xs text-ink-500">{{ t('carousel.keywordsHelp') }}</p>
      </div>

      <div class="border-t border-edge-subtle pt-8">
        <h2 class="mb-2 font-serif text-lg font-semibold text-content">{{ t('admin.instaPost.fieldCta') }}</h2>
        <p v-if="!isOwner" class="mb-3 max-w-reading text-sm text-amber-800">
          {{ t('admin.instaPost.ctaStaffHint') }}
        </p>
        <textarea
          id="insta-cta"
          v-model="ctaLocal"
          rows="4"
          maxlength="500"
          class="mb-4 w-full max-w-lg rounded-ds-md border border-edge-subtle bg-surface-page px-3 py-2 font-sans text-content outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!isOwner"
          :placeholder="t('admin.instaPost.placeholderCta')"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3 border-t border-edge-subtle pt-6">
        <button
          type="button"
          class="rounded-ds-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('admin.instaPost.saving') : t('admin.instaPost.save') }}
        </button>
        <p v-if="showSaved" class="text-sm text-emerald-700" role="status">
          {{ t('admin.instaPost.saved') }}
        </p>
      </div>
    </section>

    <section v-else class="mt-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
      <p class="max-w-reading text-sm text-content-secondary">{{ t('admin.instaPost.cannotManageDefaults') }}</p>
    </section>
  </div>
</template>
