<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE, PAGE_SHELL_INSET_CLASS } from '~/utils/pageShell'

const route = useRoute()
const { keyboardOpen } = useMobileKeyboard()

/** Scrie is a workspace: the header scrolls away and the mobile tab bar stays off. */
const isWritePage = computed(() => route.path === '/write')

const mainPadClass = computed(() => {
  if (keyboardOpen.value) return 'page-shell__main--keyboard-open'
  if (isWritePage.value) return 'page-shell__main--desktop-pad'
  return MOBILE_TAB_BAR_CLEARANCE
})
</script>

<template>
  <div class="page-shell" :class="{ 'page-shell--static-nav': isWritePage }">
    <FavoritesFlash />
    <AppNav />
    <main
      class="page-shell__main"
      :class="mainPadClass"
    >
      <div :class="PAGE_SHELL_INSET_CLASS">
        <slot />
      </div>
    </main>
    <AppFooter class="page-shell__footer" />
    <AppMobileTabBar v-if="!isWritePage" />
  </div>
</template>
