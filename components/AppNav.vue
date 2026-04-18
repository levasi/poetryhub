<script setup lang="ts">
const { t } = useI18n()

const mobileOpen = ref(false)
const route = useRoute()
const { user, isLoggedIn, logout } = useAuth()

const userMenuOpen = ref(false)

const navLinks = computed(() => [
  { label: t('home.navHome'), to: '/' },
  { label: t('nav.write'), to: '/write' },
  { label: t('nav.carousel'), to: '/carousel-generator' },
])

watch(() => route.path, () => {
  mobileOpen.value = false
  userMenuOpen.value = false
})

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

const userMenuRef = ref<HTMLElement | null>(null)
function onClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

const displayName = computed(() => user.value?.name || user.value?.email?.split('@')[0] || '')
const initials = computed(() => {
  const n = user.value?.name || user.value?.email || '?'
  return n.slice(0, 2).toUpperCase()
})

const isAdmin = computed(() => user.value?.role === 'admin')

const { showLanguageSwitch } = useSiteSettings()
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b border-edge-subtle bg-surface-raised/95 shadow-ds-nav backdrop-blur-md supports-[backdrop-filter]:bg-surface-raised/85">
    <div
      class="mx-auto flex h-[3.25rem] w-full max-w-none items-center justify-between gap-3 px-4 md:h-16 md:px-8 lg:px-10">
      <div class="flex min-w-0 items-center gap-2 md:gap-3">
        <NuxtLink to="/" class="group flex min-h-[2.75rem] min-w-0 items-center md:min-h-0">
          <span
            class="font-serif text-lg font-semibold tracking-tight text-brand transition-opacity group-hover:opacity-80 md:text-xl">
            Poetry<span class="text-content">Hub</span>
          </span>
        </NuxtLink>
      </div>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Principal">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="rounded-ds-sm px-3 py-2 text-[13px] font-medium tracking-wide text-content-secondary transition-colors hover:bg-surface-subtle/80 hover:text-content"
          active-class="bg-surface-subtle text-content">
          {{ link.label }}
        </NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin"
          class="rounded-ds-sm px-3 py-2 text-[13px] font-medium tracking-wide text-brand transition-colors hover:bg-brand-soft/25 hover:text-brand-hover"
          active-class="bg-brand-soft/30 text-content">
          {{ t('nav.admin') }}
        </NuxtLink>
      </nav>

      <!-- Desktop actions -->
      <div class="hidden items-center gap-3 md:flex">
        <LanguageSwitch v-if="showLanguageSwitch" />

        <NuxtLink to="/favorites"
          class="ds-icon-btn border-rose-200/80 text-content-muted hover:border-rose-300 hover:text-rose-600"
          :aria-label="t('nav.favorites')">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </NuxtLink>

        <div v-if="!isLoggedIn" class="flex items-center gap-3">
          <NuxtLink to="/login" class="text-sm text-content-muted transition-colors hover:text-content">
            {{ t('nav.signIn') }}
          </NuxtLink>
          <NuxtLink to="/signup" class="ds-btn-primary !py-1.5 text-sm">
            {{ t('nav.signUp') }}
          </NuxtLink>
        </div>

        <div v-else ref="userMenuRef" class="relative">
          <button type="button"
            class="flex min-h-[2.25rem] items-center gap-2 rounded-full border border-edge-subtle bg-surface-raised px-3 py-1.5 text-sm text-content-secondary transition hover:border-edge"
            @click="userMenuOpen = !userMenuOpen">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
              {{ initials }}
            </span>
            <span class="max-w-[120px] truncate">{{ displayName }}</span>
            <svg class="h-3 w-3 text-content-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="fade-down">
            <div v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-44 rounded-ds-xl border border-edge-subtle bg-surface-overlay py-1 shadow-ds-popover">
              <NuxtLink v-if="isAdmin" to="/admin"
                class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand transition hover:bg-brand-soft/20 hover:text-brand-hover"
                @click="userMenuOpen = false">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ t('nav.admin') }}
              </NuxtLink>
              <NuxtLink to="/account"
                class="flex items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-content"
                @click="userMenuOpen = false">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ t('nav.account') }}
              </NuxtLink>
              <NuxtLink to="/favorites"
                class="flex items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-content"
                @click="userMenuOpen = false">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ t('nav.favorites') }}
              </NuxtLink>
              <hr class="my-1 border-edge-subtle" />
              <button type="button"
                class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-danger"
                @click="logout">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {{ t('nav.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile: menu above language/settings -->
      <div class="flex flex-col items-end gap-2 md:hidden">
        <button
          type="button"
          class="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center bg-surface-raised p-2 text-content-muted"
          :aria-expanded="mobileOpen"
          :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')"
          @click="mobileOpen = !mobileOpen">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LanguageSwitch v-if="showLanguageSwitch" />
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="mobileOpen" class="border-t border-edge-subtle bg-surface-subtle/90 px-4 py-4 md:hidden">
        <nav class="mx-auto flex max-w-content flex-col gap-1" aria-label="Mobil">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
            class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm text-content-muted transition-colors hover:bg-surface-raised hover:text-content"
            active-class="bg-surface-raised text-content shadow-ds-card">
            {{ link.label }}
          </NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin"
            class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft/25 hover:text-brand-hover"
            active-class="bg-brand-soft/30 text-content shadow-ds-card">
            {{ t('nav.admin') }}
          </NuxtLink>
          <NuxtLink to="/favorites"
            class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm text-content-muted hover:bg-surface-raised hover:text-rose-600">
            {{ t('nav.favorites') }}
          </NuxtLink>
          <NuxtLink to="/carousel-generator"
            class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm text-content-muted hover:bg-surface-raised hover:text-content">
            {{ t('nav.carousel') }}
          </NuxtLink>
          <hr class="my-2 border-edge-subtle" />
          <div v-if="!isLoggedIn" class="flex flex-col gap-1">
            <NuxtLink to="/login"
              class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm text-content-muted hover:bg-surface-raised hover:text-content">
              {{ t('nav.signIn') }}
            </NuxtLink>
            <NuxtLink to="/signup" class="ds-btn-primary justify-center text-center">
              {{ t('nav.signUp') }}
            </NuxtLink>
          </div>
          <div v-else class="flex flex-col gap-1">
            <div class="px-3 py-2 text-ui-xs text-content-soft">{{ t('nav.signedInAs', { name: displayName }) }}</div>
            <NuxtLink to="/account"
              class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-sm text-content-muted hover:bg-surface-raised hover:text-content">
              {{ t('nav.account') }}
            </NuxtLink>
            <button type="button"
              class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-left text-sm text-content-muted hover:bg-surface-raised hover:text-danger"
              @click="logout">
              {{ t('nav.signOut') }}
            </button>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.15s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
