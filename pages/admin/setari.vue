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
<div class="admin-page admin-page--narrow">
    <p class="ds-eyebrow admin-page__eyebrow">{{ t('admin.panel') }}</p>
    <h1 class="admin-page__title admin-page__title--lg" style="margin-bottom:0.75rem">
      {{ t('admin.settings.title') }}
    </h1>
    <p class="admin-page__lead">
      {{ t('admin.settings.lead') }}
    </p>

    <section class="admin-page__card-block">
      <h2 class="admin-page__card-title admin-page__card-title--mb2">
        {{ t('admin.settings.languageSwitchTitle') }}
      </h2>
      <p class="admin-page__card-desc">
        {{ t('admin.settings.languageSwitchBody') }}
      </p>
      <label class="admin-page__checkbox-row">
        <input type="checkbox" class="admin-page__checkbox"
          :checked="siteSettings?.showLanguageSwitch === true" :disabled="savingLang"
          @change="setLanguageSwitch(($event.target as HTMLInputElement).checked)" />
        <span>{{ t('admin.settings.languageSwitchLabel') }}</span>
      </label>
      <p v-if="saveError" class="admin-page__owner-note" style="margin-top:0.75rem;color:rgb(var(--color-danger))">{{ saveError }}</p>
      <p v-else-if="savingLang" class="admin-page__saving">{{ t('admin.settings.languageSwitchSaving') }}</p>
    </section>

    <section class="admin-page__card-block">
      <h2 class="admin-page__card-title admin-page__card-title--mb2">
        {{ t('admin.settings.schemesTitle') }}
      </h2>
      <p class="admin-page__card-desc">
        {{ t('admin.settings.schemesBody') }}
      </p>
      <ColorSchemeSwitch />
    </section>
  </div>
</template>
