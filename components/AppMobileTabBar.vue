<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useI18n()
const route = useRoute()
const settingsOpen = useState('mobile-settings-open', () => false)

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
    class="fixed inset-x-0 bottom-0 z-[45] border-t border-edge-subtle bg-surface-raised/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-2px_16px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
    :aria-label="t('nav.mobileTabBarAria')"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[3rem] min-w-0 flex-1 flex-col items-center justify-center px-1 transition-colors"
        :class="isActive(item) ? 'text-brand' : 'text-content-muted'"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-label="item.label"
        @click="settingsOpen = false"
      >
        <Icon
          :icon="isActive(item) ? item.iconActive : item.icon"
          class="h-6 w-6"
          aria-hidden="true"
        />
      </NuxtLink>

      <button
        type="button"
        class="flex min-h-[3rem] min-w-0 flex-1 flex-col items-center justify-center px-1 transition-colors"
        :class="settingsOpen ? 'text-brand' : 'text-content-muted'"
        :aria-label="t('nav.mobileSettings')"
        :aria-pressed="settingsOpen"
        :aria-expanded="settingsOpen"
        aria-controls="mobile-settings-sheet"
        @click="toggleSettings"
      >
        <Icon
          :icon="settingsOpen ? 'heroicons:cog-6-tooth-solid' : 'heroicons:cog-6-tooth'"
          class="h-6 w-6"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>

  <AppMobileSettingsSheet />
</template>
