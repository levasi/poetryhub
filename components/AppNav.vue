<script setup lang="ts">
const { t } = useI18n()

const mobileOpen = ref(false)
const route = useRoute()
const { user, isLoggedIn, logout } = useAuth()

const userMenuOpen = ref(false)

const navLinks = computed(() => [
  { label: t('nav.poems'), to: '/poems' },
  { label: t('nav.authors'), to: '/authors' },
  { label: t('nav.search'), to: '/search' },
  { label: t('nav.daily'), to: '/daily' },
])

watch(() => route.path, () => {
  mobileOpen.value = false
  userMenuOpen.value = false
})

// Close user menu when clicking outside
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
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-ink-200/80 bg-ink-50/95 backdrop-blur-md">
    <div class="flex w-full items-center justify-between px-4 py-4 md:px-6">
      <!-- Logo -->
      <NuxtLink to="/" class="group flex items-center gap-2">
        <span class="font-serif text-xl font-bold text-gold-700 transition-opacity group-hover:opacity-80">
          Poetry<span class="text-ink-900">Hub</span>
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-6 md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm text-ink-600 transition-colors hover:text-ink-900"
          active-class="text-ink-900 font-medium"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Desktop actions -->
      <div class="hidden items-center gap-3 md:flex">
        <LanguageSwitch />

        <NuxtLink
          to="/search"
          class="rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
          :aria-label="t('nav.search')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </NuxtLink>

        <NuxtLink
          to="/favorites"
          class="rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-rose-300 hover:text-rose-700"
          :aria-label="t('nav.favorites')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </NuxtLink>

        <!-- Logged out: Sign in + Sign up -->
        <template v-if="!isLoggedIn">
          <NuxtLink
            to="/login"
            class="text-sm text-ink-600 transition-colors hover:text-ink-900"
          >
            {{ t('nav.signIn') }}
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="rounded-lg bg-gold-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-600"
          >
            {{ t('nav.signUp') }}
          </NuxtLink>
        </template>

        <!-- Logged in: user menu -->
        <div v-else ref="userMenuRef" class="relative">
          <button
            class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-800 transition hover:border-ink-300"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
              {{ initials }}
            </span>
            <span class="max-w-[120px] truncate">{{ displayName }}</span>
            <svg class="h-3 w-3 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="fade-down">
            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-44 rounded-xl border border-ink-200 bg-white py-1 shadow-lg"
            >
              <NuxtLink
                to="/favorites"
                class="flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ t('nav.favorites') }}
              </NuxtLink>
              <hr class="my-1 border-ink-100" />
              <button
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-red-600"
                @click="logout"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {{ t('nav.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile: language + menu -->
      <div class="flex items-center gap-2 md:hidden">
        <LanguageSwitch />
        <button
          type="button"
          class="rounded-lg border border-ink-200 bg-white p-2 text-ink-600"
          :aria-expanded="mobileOpen"
          :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')"
          @click="mobileOpen = !mobileOpen"
        >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="mobileOpen" class="border-t border-ink-200 bg-ink-50 px-4 py-4 md:hidden">
        <nav class="flex flex-col gap-3">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-white hover:text-ink-900"
            active-class="bg-white text-ink-900 shadow-sm"
          >
            {{ link.label }}
          </NuxtLink>
          <NuxtLink to="/favorites" class="rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-white hover:text-rose-700">
            {{ t('nav.favorites') }}
          </NuxtLink>
          <hr class="border-ink-200" />
          <template v-if="!isLoggedIn">
            <NuxtLink to="/login" class="rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-white hover:text-ink-900">
              {{ t('nav.signIn') }}
            </NuxtLink>
            <NuxtLink to="/signup" class="rounded-lg bg-gold-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gold-600">
              {{ t('nav.signUp') }}
            </NuxtLink>
          </template>
          <template v-else>
            <div class="px-3 py-1 text-xs text-ink-500">{{ t('nav.signedInAs', { name: displayName }) }}</div>
            <button
              class="rounded-lg px-3 py-2 text-left text-sm text-ink-600 hover:bg-white hover:text-red-600"
              @click="logout"
            >
              {{ t('nav.signOut') }}
            </button>
          </template>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-down-enter-active, .fade-down-leave-active { transition: all 0.15s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
