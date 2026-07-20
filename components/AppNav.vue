<script setup lang="ts">
import { isStaffRole } from '~/utils/roles'

const { t } = useI18n()
const route = useRoute()
const { user, isLoggedIn, logout } = useAuth()
const { showLanguageSwitch } = useSiteSettings()

const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const readingSettingsOpen = useState('reading-settings-open', () => false)

watch(() => route.path, () => {
  mobileOpen.value = false
  userMenuOpen.value = false
  readingSettingsOpen.value = false
})

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

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

const isStaff = computed(() => isStaffRole(user.value?.role))
const isPoet = computed(() => !!user.value?.isPoet)

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  if (path === '/descopera') return route.path === '/descopera'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function navLinkClass(path: string) {
  return [
    'relative inline-flex items-center px-3 py-2 text-ui-sm font-medium transition-colors',
    isActive(path)
      ? 'text-content after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-brand'
      : 'text-content-muted hover:text-content',
  ]
}

function mobileLinkClass(path: string) {
  return [
    'flex min-h-[2.75rem] items-center rounded-ds-md px-3 py-2.5 text-sm transition-colors',
    isActive(path)
      ? 'bg-brand-tint font-medium text-content'
      : 'text-content-muted hover:bg-surface-subtle hover:text-content',
  ]
}
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b border-edge-subtle bg-surface-raised/95 shadow-ds-nav backdrop-blur-md supports-[backdrop-filter]:bg-surface-raised/85">
    <div class="mx-auto flex h-14 w-full max-w-none items-center justify-between gap-3 px-4 md:h-16 md:px-8 lg:px-10">
      <NuxtLink to="/" class="group flex min-h-[2.75rem] min-w-0 items-center md:min-h-0">
        <AppLogo size="sm" />
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Principal">
        <NuxtLink to="/" :class="navLinkClass('/')">
          {{ t('nav.home') }}
        </NuxtLink>
        <NuxtLink to="/descopera" :class="navLinkClass('/descopera')">
          {{ t('nav.discover') }}
        </NuxtLink>
        <NuxtLink to="/write" :class="navLinkClass('/write')">
          {{ t('nav.write') }}
        </NuxtLink>
        <NuxtLink to="/carousel-generator" :class="navLinkClass('/carousel-generator')">
          {{ t('nav.carousel') }}
        </NuxtLink>
      </nav>

      <!-- Desktop actions -->
      <div class="hidden items-center gap-2 md:flex">
        <NuxtLink v-if="isLoggedIn" to="/favorites" class="ds-icon-btn"
          :class="isActive('/favorites') ? 'border-brand/40 text-brand' : ''" :aria-label="t('nav.favorites')">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </NuxtLink>

        <button
          type="button"
          data-reading-settings-toggle
          class="ds-icon-btn"
          :class="readingSettingsOpen ? 'border-brand/40 text-brand' : ''"
          :aria-label="readingSettingsOpen ? t('viewer.closeReadingSettings') : t('viewer.openReadingSettings')"
          :aria-pressed="readingSettingsOpen"
          :aria-expanded="readingSettingsOpen"
          @click="readingSettingsOpen = !readingSettingsOpen"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

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
            class="flex items-center gap-2 rounded-full border border-edge-subtle bg-surface-raised p-1 text-sm text-content-secondary transition hover:border-edge"
            :aria-expanded="userMenuOpen" aria-haspopup="menu" @click="userMenuOpen = !userMenuOpen">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="displayName" referrerpolicy="no-referrer"
              class="h-7 w-7 rounded-full object-cover">
            <span v-else
              class="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
              {{ initials }}
            </span>
            <span class="max-w-[120px] truncate">{{ displayName }}</span>
            <svg class="h-3 w-3 text-content-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="fade-down">
            <div v-if="userMenuOpen" role="menu"
              class="absolute right-0 mt-2 w-52 rounded-ds-xl border border-edge-subtle bg-surface-overlay py-1 shadow-ds-popover">
              <NuxtLink v-if="isStaff" to="/admin" role="menuitem"
                class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand transition hover:bg-brand-tint hover:text-brand-hover"
                @click="userMenuOpen = false">
                {{ t('nav.admin') }}
              </NuxtLink>
              <NuxtLink to="/account" role="menuitem"
                class="flex items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-content"
                @click="userMenuOpen = false">
                {{ t('nav.account') }}
              </NuxtLink>
              <NuxtLink v-if="isPoet" to="/account/poems" role="menuitem"
                class="flex items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-content"
                @click="userMenuOpen = false">
                {{ t('nav.myPoems') }}
              </NuxtLink>
              <div v-if="showLanguageSwitch" class="border-t border-edge-subtle px-4 py-2">
                <LanguageSwitch />
              </div>
              <hr class="my-1 border-edge-subtle">
              <button type="button" role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-content-muted transition hover:bg-surface-subtle hover:text-danger"
                @click="logout">
                {{ t('nav.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile menu trigger -->
      <button type="button" class="ds-icon-btn md:hidden" :aria-expanded="mobileOpen"
        :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')" @click="mobileOpen = true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <DsSheet v-model:open="mobileOpen" :title="t('nav.menu')" id-prefix="mobile-nav">
      <div class="space-y-6 pb-4">
        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuRead') }}
          </p>
          <div class="mt-2 flex flex-col gap-1">
            <NuxtLink to="/" :class="mobileLinkClass('/')" @click="mobileOpen = false">
              {{ t('nav.home') }}
            </NuxtLink>
            <NuxtLink to="/descopera" :class="mobileLinkClass('/descopera')" @click="mobileOpen = false">
              {{ t('nav.discover') }}
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" to="/favorites" :class="mobileLinkClass('/favorites')"
              @click="mobileOpen = false">
              {{ t('nav.favorites') }}
            </NuxtLink>
          </div>
        </div>

        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuWrite') }}
          </p>
          <div class="mt-2 flex flex-col gap-1">
            <NuxtLink to="/write" :class="mobileLinkClass('/write')" @click="mobileOpen = false">
              {{ t('nav.write') }}
            </NuxtLink>
            <NuxtLink to="/carousel-generator" :class="mobileLinkClass('/carousel-generator')"
              @click="mobileOpen = false">
              {{ t('nav.carousel') }}
            </NuxtLink>
          </div>
        </div>

        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuAccount') }}
          </p>
          <div class="mt-2 flex flex-col gap-1">
            <template v-if="!isLoggedIn">
              <NuxtLink to="/login" :class="mobileLinkClass('/login')" @click="mobileOpen = false">
                {{ t('nav.signIn') }}
              </NuxtLink>
              <NuxtLink to="/signup" class="ds-btn-primary justify-center text-center" @click="mobileOpen = false">
                {{ t('nav.signUp') }}
              </NuxtLink>
            </template>
            <template v-else>
              <p class="px-3 py-1 text-ui-xs text-content-soft">
                {{ t('nav.signedInAs', { name: displayName }) }}
              </p>
              <NuxtLink to="/account" :class="mobileLinkClass('/account')" @click="mobileOpen = false">
                {{ t('nav.account') }}
              </NuxtLink>
              <NuxtLink v-if="isPoet" to="/account/poems" :class="mobileLinkClass('/account/poems')"
                @click="mobileOpen = false">
                {{ t('nav.myPoems') }}
              </NuxtLink>
              <NuxtLink v-if="isStaff" to="/admin" :class="mobileLinkClass('/admin')" @click="mobileOpen = false">
                {{ t('nav.admin') }}
              </NuxtLink>
              <button type="button"
                class="min-h-[2.75rem] rounded-ds-md px-3 py-2.5 text-left text-sm text-content-muted hover:bg-surface-subtle hover:text-danger"
                @click="logout(); mobileOpen = false">
                {{ t('nav.signOut') }}
              </button>
            </template>
            <div v-if="showLanguageSwitch" class="border-t border-edge-subtle pt-3">
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </div>
    </DsSheet>
  </header>
  <ClientOnly>
    <ReaderSettingsPanel id-prefix="app" />
  </ClientOnly>
</template>

<style scoped>
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
