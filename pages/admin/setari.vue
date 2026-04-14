<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminSettings')) })

const { data: siteSettings, refresh } = useSiteSettings()
const savingLang = ref(false)
const saveError = ref('')

async function setLanguageSwitch(enabled: boolean) {
  saveError.value = ''
  savingLang.value = true
  try {
    await $fetch('/api/site/settings', { method: 'PUT', body: { showLanguageSwitch: enabled } })
    await refresh()
  } catch {
    saveError.value = t('admin.settings.languageSwitchSaveError')
    await refresh()
  } finally {
    savingLang.value = false
  }
}
</script>

<template>
  <div class="max-w-content">
    <p class="ds-eyebrow mb-2 text-content-soft">{{ t('admin.panel') }}</p>
    <h1 class="mb-3 font-serif text-3xl font-semibold tracking-tight text-content">
      {{ t('admin.settings.title') }}
    </h1>
    <p class="max-w-reading text-content-secondary">
      {{ t('admin.settings.lead') }}
    </p>

    <section class="mt-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
      <h2 class="mb-2 font-serif text-lg font-semibold text-content">
        {{ t('admin.settings.languageSwitchTitle') }}
      </h2>
      <p class="mb-6 max-w-reading text-sm text-content-secondary">
        {{ t('admin.settings.languageSwitchBody') }}
      </p>
      <label class="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-edge text-brand focus:ring-brand/40"
          :checked="siteSettings?.showLanguageSwitch === true"
          :disabled="savingLang"
          @change="setLanguageSwitch(($event.target as HTMLInputElement).checked)"
        />
        <span class="text-sm text-content">{{ t('admin.settings.languageSwitchLabel') }}</span>
      </label>
      <p v-if="saveError" class="mt-3 text-sm text-danger">{{ saveError }}</p>
      <p v-else-if="savingLang" class="mt-3 text-sm text-content-muted">{{ t('admin.settings.languageSwitchSaving') }}</p>
    </section>

    <section class="mt-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
      <h2 class="mb-2 font-serif text-lg font-semibold text-content">
        {{ t('admin.settings.schemesTitle') }}
      </h2>
      <p class="mb-6 max-w-reading text-sm text-content-secondary">
        {{ t('admin.settings.schemesBody') }}
      </p>
      <ColorSchemeSwitch />
    </section>
  </div>
</template>
