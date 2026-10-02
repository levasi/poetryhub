<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const { t } = useI18n()
const { user, logout, fetchMe } = useAdmin()
const route = useRoute()

await fetchMe()

const mobileNavOpen = ref(false)

watch(() => route.path, () => {
  mobileNavOpen.value = false
})

const navItems = computed(() => [
  { label: t('admin.nav.dashboard'), to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: t('admin.nav.poems'), to: '/admin/poems', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: t('admin.nav.authors'), to: '/admin/authors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: t('admin.nav.settings'), to: '/admin/setari', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { label: t('admin.nav.instaPost'), to: '/admin/insta-post', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: t('admin.nav.users'), to: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: t('admin.nav.import'), to: '/admin/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
])

function isNavActive(item: { to: string }) {
  if (item.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile top bar -->
    <header class="admin-layout__mobile-header">
      <AppLogo size="sm" />
      <button
        type="button"
        class="ds-icon-btn"
        :aria-label="t('nav.menu')"
        @click="mobileNavOpen = true"
      >
        <svg class="admin-layout__menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>

    <div class="admin-layout__body">
      <aside class="admin-layout__sidebar">
        <div class="admin-layout__brand">
          <NuxtLink to="/" class="admin-layout__brand-link">
            <AppLogo />
          </NuxtLink>
          <p class="admin-layout__brand-label">{{ t('admin.panel') }}</p>
        </div>

        <nav class="admin-layout__nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="admin-layout__nav-link"
            :class="{ 'admin-layout__nav-link--active': isNavActive(item) }"
          >
            <svg class="admin-layout__nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="admin-layout__footer">
          <p class="admin-layout__user-email">{{ user?.email }}</p>
          <button
            type="button"
            class="admin-layout__logout"
            @click="logout"
          >
            {{ t('admin.signOut') }}
          </button>
        </div>
      </aside>

      <main class="admin-layout__main">
        <slot />
      </main>
    </div>

    <DsSheet
      v-model:open="mobileNavOpen"
      :title="t('admin.panel')"
      id-prefix="admin-nav"
    >
      <nav>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-layout__sheet-link"
          :class="{ 'admin-layout__sheet-link--active': isNavActive(item) }"
          @click="mobileNavOpen = false"
        >
          <svg class="admin-layout__nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="admin-layout__sheet-footer">
        <p class="admin-layout__user-email">{{ user?.email }}</p>
        <button
          type="button"
          class="ds-btn-secondary admin-layout__sheet-logout"
          @click="logout"
        >
          {{ t('admin.signOut') }}
        </button>
      </div>
    </DsSheet>
  </div>
</template>
