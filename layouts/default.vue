<template>
  <div class="flex min-h-screen w-full flex-col bg-surface-page">
    <FavoritesFlash />
    <AppNav />
    <main class="w-full flex-1 px-4 py-4">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
