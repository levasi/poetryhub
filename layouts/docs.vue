<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE } from '~/utils/pageShell'

const route = useRoute()
const mobileNavOpen = ref(false)

watch(() => route.path, () => {
  mobileNavOpen.value = false
})
</script>

<template>
  <div class="flex min-h-screen w-full min-w-0 flex-col bg-surface-page">
    <FavoritesFlash />
    <AppNav />

    <div class="flex w-full min-w-0 flex-1">
      <!-- Desktop sidebar -->
      <aside
        class="sticky top-[3.25rem] z-10 hidden h-[calc(100vh-3.25rem)] w-64 shrink-0 flex-col border-r border-edge-subtle bg-surface-raised/90 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-surface-raised/80 md:top-16 md:flex md:h-[calc(100vh-4rem)] lg:w-72"
      >
        <div class="border-b border-edge-subtle px-4 py-5">
          <NuxtLink to="/docs" class="group block">
            <p class="font-serif text-base font-semibold text-content group-hover:text-brand">Documentație</p>
            <p class="mt-0.5 text-xs text-content-soft">PoetryHub — stack, API, features</p>
          </NuxtLink>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-3">
          <DocsSidebarNav />
        </div>

        <div class="border-t border-edge-subtle px-4 py-4">
          <NuxtLink to="/" class="text-xs text-content-soft transition hover:text-content">
            ← Înapoi la aplicație
          </NuxtLink>
        </div>
      </aside>

      <!-- Mobile nav trigger -->
      <div class="fixed bottom-0 left-0 right-0 z-30 flex border-t border-edge-subtle bg-surface-raised/95 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
        <button
          type="button"
          class="flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-content-muted"
          @click="mobileNavOpen = true"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft/40 text-brand">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          Docs
        </button>
      </div>

      <main class="min-h-[60vh] min-w-0 flex-1 px-4 pt-8 md:px-10 md:pt-10 lg:px-12" :class="MOBILE_TAB_BAR_CLEARANCE">
        <slot />
      </main>
    </div>

    <DsSheet v-model:open="mobileNavOpen" title="Documentație" id-prefix="docs-nav">
      <DocsSidebarNav :on-navigate="() => { mobileNavOpen = false }" />
    </DsSheet>
  </div>
</template>
