<script setup lang="ts">
import type { CarouselTheme } from '~/composables/useCarouselGenerator'
import { CAROUSEL_THEME_IDS } from '~/composables/useCarouselGenerator'
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import CarouselFontSelect from '~/components/carousel/CarouselFontSelect.vue'
import type { CarouselSiteDefaultsPayload } from '~/utils/carouselSiteDefaults'
import { CAROUSEL_FONT_WEIGHT_PRESETS } from '~/utils/carouselFontWeights'
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
const bodyFontWeight = ref<number | null>(null)
const titleFontWeight = ref<number | null>(null)
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
    bodyFontWeight.value = d.bodyFontWeight ?? null
    titleFontWeight.value = d.titleFontWeight ?? null
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
    bodyFontWeight: bodyFontWeight.value,
    titleFontWeight: titleFontWeight.value,
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
  <div class="admin-page admin-page--narrow">
    <p class="ds-eyebrow admin-page__eyebrow">{{ t('admin.panel') }}</p>
    <h1 class="admin-page__title admin-page__title--lg" style="margin-bottom:0.75rem">
      {{ t('admin.instaPost.title') }}
    </h1>
    <p class="admin-page__lead">
      {{ t('admin.instaPost.lead') }}
    </p>

    <p class="admin-page__lead admin-page__lead--muted">
      {{ t('admin.instaPost.placeholderPoemIntro') }}
      <NuxtLink
        class="admin-page__link-inline"
        :to="{ path: `/authors/${PLACEHOLDER_AUTHOR_SLUG}`, query: { poem: PLACEHOLDER_POEM_SLUG } }"
      >
        {{ t('admin.instaPost.placeholderPoemLink') }}
      </NuxtLink>
    </p>

    <section
      v-if="canManageDefaults"
      class="admin-page__card-block admin-page__card-block--stack"
    >
      <div>
        <h2 class="admin-page__card-title admin-page__card-title--mb4">
          {{ t('admin.instaPost.sectionCarouselDefaults') }}
        </h2>

        <label class="admin-page__field-label admin-page__field-label--upper">{{
          t('carousel.fieldTheme')
        }}</label>
        <div class="admin-page__chip-row">
          <button
            v-for="th in CAROUSEL_THEME_IDS"
            :key="th"
            type="button"
            class="admin-page__chip"
            :class="
              theme === th
                ? 'admin-page__chip--active'
                : ''
            "
            @click="theme = th"
          >
            {{ t(`carousel.theme.${th}`) }}
          </button>
        </div>

        <label class="admin-page__field-label admin-page__field-label--upper">{{
          t('carousel.fieldFont')
        }}</label>
        <CarouselFontSelect v-model="carouselFontKey" class="admin-page__font-select" />

        <label class="admin-page__field-label admin-page__field-label--upper">{{
          t('carousel.fieldLinesPerSlide')
        }}</label>
        <div class="admin-page__range-row">
          <input
            v-model.number="linesPerSlide"
            type="range"
            min="4"
            max="16"
            step="1"
            class="admin-page__range"
          />
          <span class="admin-page__range-val">{{ linesPerSlide }}</span>
        </div>

        <label class="admin-page__field-label admin-page__field-label--upper">{{
          t('carousel.fieldBodyFontSize')
        }}</label>
        <div class="admin-page__range-row">
          <input
            v-model.number="bodyFontSizeScale"
            type="range"
            min="0.7"
            max="2"
            step="0.05"
            class="admin-page__range"
          />
          <span class="admin-page__range-val admin-page__range-val--wide">{{ Math.round(bodyFontSizeScale * 100)
          }}%</span>
        </div>

        <label class="admin-page__field-label admin-page__field-label--upper">{{
          t('carousel.fieldLineHeight')
        }}</label>
        <div class="admin-page__range-row">
          <input
            v-model.number="bodyLineHeight"
            type="range"
            min="1.15"
            max="2.25"
            step="0.05"
            class="admin-page__range"
          />
          <span class="admin-page__range-val admin-page__range-val--wide">{{ bodyLineHeight.toFixed(2) }}</span>
        </div>

        <label class="admin-page__field-label admin-page__field-label--upper" for="insta-body-weight">{{
          t('carousel.fieldBodyFontWeight')
        }}</label>
        <select
          id="insta-body-weight"
          class="admin-page__select"
          :value="bodyFontWeight ?? ''"
          @change="
            bodyFontWeight =
              ($event.target as HTMLSelectElement).value === ''
                ? null
                : Number(($event.target as HTMLSelectElement).value)
          "
        >
          <option value="">{{ t('carousel.fontWeightDefault') }}</option>
          <option v-for="w in CAROUSEL_FONT_WEIGHT_PRESETS" :key="w" :value="w">
            {{ t(`carousel.fontWeight.${w}`) }}
          </option>
        </select>

        <label class="admin-page__field-label admin-page__field-label--upper" for="insta-title-weight">{{
          t('carousel.fieldTitleFontWeight')
        }}</label>
        <select
          id="insta-title-weight"
          class="admin-page__select"
          :value="titleFontWeight ?? ''"
          @change="
            titleFontWeight =
              ($event.target as HTMLSelectElement).value === ''
                ? null
                : Number(($event.target as HTMLSelectElement).value)
          "
        >
          <option value="">{{ t('carousel.fontWeightDefault') }}</option>
          <option v-for="w in CAROUSEL_FONT_WEIGHT_PRESETS" :key="w" :value="w">
            {{ t(`carousel.fontWeight.${w}`) }}
          </option>
        </select>

        <label class="admin-page__field-label admin-page__field-label--upper" for="insta-keywords">{{
          t('carousel.fieldKeywords')
        }}</label>
        <input
          id="insta-keywords"
          v-model="keywordLocal"
          type="text"
          maxlength="2000"
          class="admin-page__text-input"
          :placeholder="t('carousel.phKeywords')"
        />
        <p class="admin-page__hint">{{ t('carousel.keywordsHelp') }}</p>
      </div>

      <div class="admin-page__divider">
        <h2 class="admin-page__card-title admin-page__card-title--mb2">{{ t('admin.instaPost.fieldCta') }}</h2>
        <p v-if="!isOwner" class="admin-page__warn">
          {{ t('admin.instaPost.ctaStaffHint') }}
        </p>
        <textarea
          id="insta-cta"
          v-model="ctaLocal"
          rows="4"
          maxlength="500"
          class="admin-page__text-input admin-page__text-input--cta"
          :disabled="!isOwner"
          :placeholder="t('admin.instaPost.placeholderCta')"
        />
      </div>

      <div class="admin-page__divider admin-page__divider--actions">
        <button
          type="button"
          class="admin-page__btn-brand"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('admin.instaPost.saving') : t('admin.instaPost.save') }}
        </button>
        <p v-if="showSaved" class="admin-page__saved" role="status">
          {{ t('admin.instaPost.saved') }}
        </p>
      </div>
    </section>

    <section v-else class="admin-page__card-block">
      <p class="admin-page__card-desc">{{ t('admin.instaPost.cannotManageDefaults') }}</p>
    </section>
  </div>
</template>
