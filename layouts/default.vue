<template>
  <div class="flex min-h-screen w-full flex-col bg-surface-page">
    <AppNav />
    <main class="w-full flex-1 px-4 py-12 md:px-6 md:py-16">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
