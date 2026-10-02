<script setup lang="ts">
import { PAGE_SHELL_INSET_CLASS } from '~/utils/pageShell'
</script>

<template>
  <div class="carousel-layout">
    <FavoritesFlash />
    <AppNav />
    <main class="carousel-layout__main">
      <div :class="PAGE_SHELL_INSET_CLASS">
        <slot />
      </div>
    </main>
  </div>
</template>
