<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE, PAGE_SHELL_INSET_CLASS } from '~/utils/pageShell'
</script>

<template>
  <div class="flex min-h-screen w-full min-w-0 flex-col bg-surface-page">
    <FavoritesFlash />
    <AppNav />
    <main class="w-full min-w-0 flex-1" :class="MOBILE_TAB_BAR_CLEARANCE">
      <div :class="PAGE_SHELL_INSET_CLASS">
        <slot />
      </div>
    </main>
    <AppFooter class="hidden md:block" />
    <AppMobileTabBar />
  </div>
</template>
