<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE, PAGE_SHELL_INSET_CLASS } from '~/utils/pageShell'

const { keyboardOpen } = useMobileKeyboard()
</script>

<template>
  <div class="page-shell">
    <FavoritesFlash />
    <AppNav />
    <main
      class="page-shell__main"
      :class="keyboardOpen ? 'page-shell__main--keyboard-open' : MOBILE_TAB_BAR_CLEARANCE"
    >
      <div :class="PAGE_SHELL_INSET_CLASS">
        <slot />
      </div>
    </main>
    <AppFooter class="page-shell__footer" />
    <AppMobileTabBar />
  </div>
</template>
