<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const items = computed(() => [
  {
    to: '/',
    label: t('nav.home'),
    match: (path: string) => path === '/',
    icon: 'home' as const,
  },
  {
    to: '/descopera',
    label: t('nav.menuRead'),
    match: (path: string) =>
      path === '/descopera' || path.startsWith('/authors/') || path.startsWith('/poems/'),
    icon: 'read' as const,
  },
])

function isActive(item: (typeof items.value)[number]) {
  return item.match(route.path)
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
        class="flex min-h-[3rem] min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors"
        :class="isActive(item) ? 'text-content' : 'text-content-muted'"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <!-- Home -->
        <svg
          v-if="item.icon === 'home'"
          class="h-6 w-6"
          viewBox="0 0 24 24"
          :fill="isActive(item) ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 10.5 12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
          />
        </svg>
        <!-- Read -->
        <svg
          v-else
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          :stroke-width="isActive(item) ? 2.25 : 1.75"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
