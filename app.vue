<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: locale,
  },
})
</script>

<template>
  <div class="app-root">
    <PageLoadingOverlay />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
