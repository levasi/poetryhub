<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminAspect')) })
</script>

<template>
  <div class="max-w-content">
    <p class="ds-eyebrow mb-2 text-content-soft">{{ t('admin.panel') }}</p>
    <h1 class="mb-3 font-serif text-3xl font-semibold tracking-tight text-content">
      {{ t('admin.aspect.title') }}
    </h1>
    <p class="max-w-reading text-content-secondary">
      {{ t('admin.aspect.lead') }}
    </p>

    <section class="mt-10 rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
      <h2 class="mb-2 font-serif text-lg font-semibold text-content">
        {{ t('admin.aspect.schemesTitle') }}
      </h2>
      <p class="mb-6 max-w-reading text-sm text-content-secondary">
        {{ t('admin.aspect.schemesBody') }}
      </p>
      <ColorSchemeSwitch />
    </section>
  </div>
</template>
