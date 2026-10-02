<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useI18n()
const route = useRoute()
const settingsOpen = useState('reading-settings-open', () => false)
const { keyboardOpen } = useMobileKeyboard()
trackMobileKeyboard()

const items = computed(() => [
  {
    to: '/',
    label: t('nav.home'),
    match: (path: string) => path === '/',
    icon: 'heroicons:home',
    iconActive: 'heroicons:home-solid',
  },
  {
    to: '/search',
    label: t('nav.search'),
    match: (path: string) => path === '/search' || path.startsWith('/search/'),
    icon: 'heroicons:magnifying-glass',
    iconActive: 'heroicons:magnifying-glass-solid',
  },
  {
    to: '/descopera',
    label: t('nav.menuRead'),
    match: (path: string) =>
      path === '/descopera' || path.startsWith('/authors/') || path.startsWith('/poems/'),
    icon: 'heroicons:book-open',
    iconActive: 'heroicons:book-open-solid',
  },
])

function isActive(item: (typeof items.value)[number]) {
  return item.match(route.path)
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
}
</script>

<template>
  <nav
    v-show="!keyboardOpen"
    class="mobile-tab-bar"
    :aria-label="t('nav.mobileTabBarAria')"
  >
    <div class="mobile-tab-bar__inner">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="mobile-tab-bar__item"
        :class="{ 'mobile-tab-bar__item--active': isActive(item) }"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-label="item.label"
        @click="settingsOpen = false"
      >
        <Icon
          :icon="isActive(item) ? item.iconActive : item.icon"
          class="mobile-tab-bar__icon"
          aria-hidden="true"
        />
      </NuxtLink>

      <button
        type="button"
        data-reading-settings-toggle
        class="mobile-tab-bar__item"
        :class="{ 'mobile-tab-bar__item--active': settingsOpen }"
        :aria-label="t('nav.mobileSettings')"
        :aria-pressed="settingsOpen"
        :aria-expanded="settingsOpen"
        aria-controls="reading-settings-panel"
        @click="toggleSettings"
      >
        <Icon
          :icon="settingsOpen ? 'heroicons:cog-6-tooth-solid' : 'heroicons:cog-6-tooth'"
          class="mobile-tab-bar__icon"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
