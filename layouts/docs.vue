<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE } from '~/utils/pageShell'

const route = useRoute()
const mobileNavOpen = ref(false)

watch(() => route.path, () => {
  mobileNavOpen.value = false
})
</script>

<template>
  <div class="docs-layout">
    <FavoritesFlash />
    <AppNav />

    <div class="docs-layout__body">
      <!-- Desktop sidebar -->
      <aside class="docs-layout__sidebar">
        <div class="docs-layout__brand">
          <NuxtLink to="/docs" class="docs-layout__brand-link">
            <p class="docs-layout__brand-title">Documentație</p>
            <p class="docs-layout__brand-subtitle">PoetryHub — stack, API, features</p>
          </NuxtLink>
        </div>

        <div class="docs-layout__sidebar-nav">
          <DocsSidebarNav />
        </div>

        <div class="docs-layout__sidebar-footer">
          <NuxtLink to="/" class="docs-layout__back-link">
            ← Înapoi la aplicație
          </NuxtLink>
        </div>
      </aside>

      <!-- Mobile nav trigger -->
      <div class="docs-layout__mobile-bar">
        <button
          type="button"
          class="docs-layout__mobile-trigger"
          @click="mobileNavOpen = true"
        >
          <span class="docs-layout__mobile-trigger-icon-wrap">
            <svg class="docs-layout__mobile-trigger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          Docs
        </button>
      </div>

      <main class="docs-layout__main" :class="MOBILE_TAB_BAR_CLEARANCE">
        <slot />
      </main>
    </div>

    <DsSheet v-model:open="mobileNavOpen" title="Documentație" id-prefix="docs-nav">
      <DocsSidebarNav :on-navigate="() => { mobileNavOpen = false }" />
    </DsSheet>
  </div>
</template>
