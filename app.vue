<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: locale,
  },
})
</script>

<template>
  <div class="min-h-screen w-full min-w-0 overflow-x-clip bg-surface-page text-content antialiased">
    <PageLoadingOverlay />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
