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
  return ['app-nav__link', { 'app-nav__link--active': isActive(path) }]
}

function mobileLinkClass(path: string) {
  return ['app-nav__mobile-link', { 'app-nav__mobile-link--active': isActive(path) }]
}
</script>

<template>
  <header class="app-nav">
    <div class="app-nav__inner">
      <NuxtLink to="/" class="app-nav__brand">
        <AppLogo size="sm" />
      </NuxtLink>

      <nav class="app-nav__links" aria-label="Principal">
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

      <div class="app-nav__actions">
        <NuxtLink
          v-if="isLoggedIn"
          to="/favorites"
          class="ds-icon-btn ds-icon-btn--muted"
          :class="{ 'is-active': isActive('/favorites') }"
          :aria-label="t('nav.favorites')"
        >
          <svg class="app-nav__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </NuxtLink>

        <button
          type="button"
          data-reading-settings-toggle
          class="ds-icon-btn ds-icon-btn--muted"
          :class="{ 'is-active': readingSettingsOpen }"
          :aria-label="readingSettingsOpen ? t('viewer.closeReadingSettings') : t('viewer.openReadingSettings')"
          :aria-pressed="readingSettingsOpen"
          :aria-expanded="readingSettingsOpen"
          @click="readingSettingsOpen = !readingSettingsOpen"
        >
          <svg class="app-nav__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div v-if="!isLoggedIn" class="app-nav__auth">
          <NuxtLink to="/login" class="app-nav__sign-in">
            {{ t('nav.signIn') }}
          </NuxtLink>
          <NuxtLink to="/signup" class="ds-btn-primary ds-btn--compact">
            {{ t('nav.signUp') }}
          </NuxtLink>
        </div>

        <div v-else ref="userMenuRef" class="app-nav__user">
          <button
            type="button"
            class="app-nav__user-trigger"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <img
              v-if="user?.imageUrl"
              :src="user.imageUrl"
              :alt="displayName"
              referrerpolicy="no-referrer"
              class="app-nav__avatar"
            >
            <span v-else class="app-nav__avatar-fallback">
              {{ initials }}
            </span>
            <span class="app-nav__user-name">{{ displayName }}</span>
            <svg class="app-nav__chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="fade-down">
            <div v-if="userMenuOpen" role="menu" class="app-nav__dropdown">
              <NuxtLink
                v-if="isStaff"
                to="/admin"
                role="menuitem"
                class="app-nav__menu-item app-nav__menu-item--admin"
                @click="userMenuOpen = false"
              >
                {{ t('nav.admin') }}
              </NuxtLink>
              <NuxtLink
                to="/account"
                role="menuitem"
                class="app-nav__menu-item"
                @click="userMenuOpen = false"
              >
                {{ t('nav.account') }}
              </NuxtLink>
              <NuxtLink
                v-if="isPoet"
                to="/account/poems"
                role="menuitem"
                class="app-nav__menu-item"
                @click="userMenuOpen = false"
              >
                {{ t('nav.myPoems') }}
              </NuxtLink>
              <div v-if="showLanguageSwitch" class="app-nav__menu-lang">
                <LanguageSwitch />
              </div>
              <hr class="app-nav__menu-divider">
              <button
                type="button"
                role="menuitem"
                class="app-nav__menu-item app-nav__menu-item--danger"
                @click="logout"
              >
                {{ t('nav.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <button
        type="button"
        class="ds-icon-btn app-nav__menu-toggle"
        :aria-expanded="mobileOpen"
        :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')"
        @click="mobileOpen = true"
      >
        <svg class="app-nav__icon app-nav__icon--lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <DsSheet v-model:open="mobileOpen" :title="t('nav.menu')" id-prefix="mobile-nav">
      <div class="app-nav__mobile-sections">
        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuRead') }}
          </p>
          <div class="app-nav__mobile-stack">
            <NuxtLink to="/" :class="mobileLinkClass('/')" @click="mobileOpen = false">
              {{ t('nav.home') }}
            </NuxtLink>
            <NuxtLink to="/descopera" :class="mobileLinkClass('/descopera')" @click="mobileOpen = false">
              {{ t('nav.discover') }}
            </NuxtLink>
            <NuxtLink
              v-if="isLoggedIn"
              to="/favorites"
              :class="mobileLinkClass('/favorites')"
              @click="mobileOpen = false"
            >
              {{ t('nav.favorites') }}
            </NuxtLink>
          </div>
        </div>

        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuWrite') }}
          </p>
          <div class="app-nav__mobile-stack">
            <NuxtLink to="/write" :class="mobileLinkClass('/write')" @click="mobileOpen = false">
              {{ t('nav.write') }}
            </NuxtLink>
            <NuxtLink
              to="/carousel-generator"
              :class="mobileLinkClass('/carousel-generator')"
              @click="mobileOpen = false"
            >
              {{ t('nav.carousel') }}
            </NuxtLink>
          </div>
        </div>

        <div>
          <p class="ds-eyebrow">
            {{ t('nav.menuAccount') }}
          </p>
          <div class="app-nav__mobile-stack">
            <template v-if="!isLoggedIn">
              <NuxtLink to="/login" :class="mobileLinkClass('/login')" @click="mobileOpen = false">
                {{ t('nav.signIn') }}
              </NuxtLink>
              <NuxtLink to="/signup" class="ds-btn-primary justify-center text-center" @click="mobileOpen = false">
                {{ t('nav.signUp') }}
              </NuxtLink>
            </template>
            <template v-else>
              <p class="app-nav__signed-in-as">
                {{ t('nav.signedInAs', { name: displayName }) }}
              </p>
              <NuxtLink to="/account" :class="mobileLinkClass('/account')" @click="mobileOpen = false">
                {{ t('nav.account') }}
              </NuxtLink>
              <NuxtLink
                v-if="isPoet"
                to="/account/poems"
                :class="mobileLinkClass('/account/poems')"
                @click="mobileOpen = false"
              >
                {{ t('nav.myPoems') }}
              </NuxtLink>
              <NuxtLink v-if="isStaff" to="/admin" :class="mobileLinkClass('/admin')" @click="mobileOpen = false">
                {{ t('nav.admin') }}
              </NuxtLink>
              <button
                type="button"
                class="app-nav__sign-out"
                @click="logout(); mobileOpen = false"
              >
                {{ t('nav.signOut') }}
              </button>
            </template>
            <div v-if="showLanguageSwitch" class="app-nav__mobile-lang">
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
