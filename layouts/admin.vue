<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const { t } = useI18n()
const { user, logout } = useAdmin()
const route = useRoute()

const navItems = computed(() => [
  { label: t('admin.nav.dashboard'), to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: t('admin.nav.poems'), to: '/admin/poems', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: t('admin.nav.authors'), to: '/admin/authors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: t('admin.nav.import'), to: '/admin/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
])
</script>

<template>
  <div class="min-h-screen w-full bg-ink-50">
    <div class="flex w-full">
      <!-- Sidebar -->
      <aside class="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
        <!-- Logo -->
        <div class="border-b border-ink-200 px-6 py-5">
          <NuxtLink to="/" class="font-serif text-lg font-bold">
            <span class="text-gold-700">Poetry</span><span class="text-ink-900">Hub</span>
          </NuxtLink>
          <p class="mt-0.5 text-xs text-ink-500">{{ t('admin.panel') }}</p>
        </div>

        <!-- Nav -->
        <nav class="flex-1 space-y-1 px-3 py-4">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
            :class="{ 'bg-amber-50 text-ink-900': route.path === item.to || (item.to !== '/admin' && route.path.startsWith(item.to)) }"
            :exact="item.to === '/admin'"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- User footer -->
        <div class="border-t border-ink-200 px-4 py-4">
          <p class="mb-2 truncate text-xs text-ink-500">{{ user?.email }}</p>
          <button
            type="button"
            class="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-red-200 hover:text-red-600"
            @click="logout"
          >
            {{ t('admin.signOut') }}
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="min-h-screen flex-1 overflow-auto p-6 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
