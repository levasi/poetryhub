<script setup lang="ts">
import type { CarouselSiteDefaultsPayload } from '~/utils/carouselSiteDefaults'
import { isCarouselSiteOwnerEmail } from '~/utils/carouselDefaultsAdmin'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
const config = useRuntimeConfig()
const { user, fetchMe } = useAdmin()

useSeoMeta({ title: computed(() => t('seo.adminInstaPost')) })

await fetchMe()

const isOwner = computed(() =>
  Boolean(
    user.value?.email &&
      isCarouselSiteOwnerEmail(user.value.email, config.public.carouselDefaultsAdminEmail as string | undefined),
  ),
)

const { data: defaults, refresh } = await useFetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults')
const ctaLocal = ref('')

watch(
  defaults,
  (d) => {
    if (d) ctaLocal.value = d.ctaText
  },
  { immediate: true },
)

const saving = ref(false)
const showSaved = ref(false)

async function save() {
  const base = defaults.value
  if (!base || !isOwner.value) return
  saving.value = true
  showSaved.value = false
  try {
    await $fetch<CarouselSiteDefaultsPayload>('/api/carousel/defaults', {
      method: 'PUT',
      body: { ...base, ctaText: ctaLocal.value.trim() },
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

    <section class="mt-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
      <template v-if="isOwner">
        <label class="mb-2 block text-sm font-medium text-content" for="insta-cta">{{ t('admin.instaPost.fieldCta') }}</label>
        <textarea
          id="insta-cta"
          v-model="ctaLocal"
          rows="4"
          maxlength="500"
          class="mb-4 w-full max-w-lg rounded-ds-md border border-edge-subtle bg-surface-page px-3 py-2 font-sans text-content outline-none focus:border-brand"
          :placeholder="t('admin.instaPost.placeholderCta')"
        />
        <button
          type="button"
          class="rounded-ds-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('admin.instaPost.saving') : t('admin.instaPost.save') }}
        </button>
        <p v-if="showSaved" class="mt-3 text-sm text-emerald-700" role="status">
          {{ t('admin.instaPost.saved') }}
        </p>
      </template>
      <p v-else class="max-w-reading text-sm text-content-secondary">
        {{ t('admin.instaPost.ownerOnly') }}
      </p>
    </section>
  </div>
</template>
