<script setup lang="ts">
const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()

// Redirect to login if not authenticated
if (!user.value) await navigateTo('/login?redirect=' + route.fullPath)

const navItems = computed(() => [
  {
    label: t('account.navProfile'),
    to: '/account',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: t('account.navPoems'),
    to: '/account/poems',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
])

function navIsActive(to: string) {
  const p = route.path
  if (to === '/account') return p === '/account' || p === '/account/'
  return p === to || p.startsWith(`${to}/`)
}

const displayInitials = computed(() => {
  const n = user.value?.name || user.value?.email || '?'
  return n.slice(0, 2).toUpperCase()
})

const displayName = computed(() => user.value?.name || user.value?.email?.split('@')[0] || '')
</script>

<template>
  <div class="flex min-h-screen w-full flex-col bg-surface-page">
    <FavoritesFlash />
    <AppNav />

    <!-- Full-width row: sidebar flush left, main fills the rest (page bodies use their own max-width). -->
    <div class="flex w-full flex-1">
      <!-- Sidebar (desktop) -->
      <aside
        class="sticky top-[3.25rem] z-10 hidden h-[calc(100vh-3.25rem)] w-60 shrink-0 flex-col border-r border-edge-subtle bg-surface-raised/90 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-surface-raised/80 md:top-16 md:flex md:h-[calc(100vh-4rem)] lg:w-64"
      >
        <div class="border-b border-edge-subtle px-5 py-6">
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-sm ring-2 ring-brand-soft/50"
            >
              {{ displayInitials }}
            </div>
            <div class="min-w-0">
              <p class="truncate font-serif text-sm font-semibold text-content">{{ displayName }}</p>
              <p class="truncate text-xs text-content-soft">{{ user?.email }}</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 space-y-0.5 px-3 py-4" aria-label="Account">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-ds-lg px-3 py-2.5 text-sm text-content-muted transition-colors hover:bg-surface-subtle hover:text-content"
            :class="navIsActive(item.to) ? 'bg-brand-soft/35 font-medium text-content shadow-sm' : ''"
          >
            <svg class="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="border-t border-edge-subtle px-3 py-4">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-ds-lg px-3 py-2.5 text-sm text-content-muted transition-colors hover:bg-danger/5 hover:text-danger"
            @click="logout"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ t('account.signOut') }}
          </button>
        </div>
      </aside>

      <!-- Mobile tab bar -->
      <div
        class="fixed bottom-0 left-0 right-0 z-30 flex border-t border-edge-subtle bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-content-muted transition"
          :class="navIsActive(item.to) ? 'text-brand' : ''"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full transition"
            :class="navIsActive(item.to) ? 'bg-brand-soft/40 text-brand' : ''"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          {{ item.label }}
        </NuxtLink>
      </div>

      <!-- Main -->
      <main class="min-h-[60vh] min-w-0 flex-1 px-4 pb-24 pt-8 md:px-8 md:pb-14 md:pt-10 lg:px-10">
        <slot />
      </main>
    </div>

    <AppFooter />
  </div>
</template>
