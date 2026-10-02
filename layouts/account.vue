<script setup lang="ts">
import { MOBILE_TAB_BAR_CLEARANCE } from '~/utils/pageShell'

const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()

// Redirect to login if not authenticated
if (!user.value) await navigateTo('/login?redirect=' + route.fullPath)

const navItems = computed(() => {
  const items = [
    {
      label: t('account.navProfile'),
      to: '/account',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      label: t('account.navInstaPosts'),
      to: '/account/insta-posts',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
  ]

  if (user.value?.isPoet) {
    items.push({
      label: t('account.navPoems'),
      to: '/account/poems',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    })
  }

  return items
})

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
  <div class="account-layout">
    <FavoritesFlash />
    <AppNav />

    <!-- Full-width row: sidebar flush left, main fills the rest (page bodies use their own max-width). -->
    <div class="account-layout__body">
      <!-- Sidebar (desktop) -->
      <aside class="account-layout__sidebar">
        <div class="account-layout__profile">
          <div class="account-layout__profile-row">
            <div class="account-layout__avatar">
              {{ displayInitials }}
            </div>
            <div class="account-layout__profile-meta">
              <p class="account-layout__profile-name">{{ displayName }}</p>
              <p class="account-layout__profile-email">{{ user?.email }}</p>
            </div>
          </div>
        </div>

        <nav class="account-layout__nav" aria-label="Account">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="account-layout__nav-link"
            :class="{ 'account-layout__nav-link--active': navIsActive(item.to) }"
          >
            <svg class="account-layout__nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="account-layout__footer">
          <button
            type="button"
            class="account-layout__logout"
            @click="logout"
          >
            <svg class="account-layout__logout-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ t('account.signOut') }}
          </button>
        </div>
      </aside>

      <!-- Mobile tab bar -->
      <div class="account-layout__mobile-tabs">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="account-layout__mobile-tab"
          :class="{ 'account-layout__mobile-tab--active': navIsActive(item.to) }"
        >
          <span class="account-layout__mobile-tab-icon-wrap">
            <svg class="account-layout__mobile-tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          <span class="account-layout__mobile-tab-label">{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- Main -->
      <main class="account-layout__main" :class="MOBILE_TAB_BAR_CLEARANCE">
        <slot />
      </main>
    </div>
  </div>
</template>
