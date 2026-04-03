<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t, locale } = useI18n()
useSeoMeta({ title: computed(() => `${t('admin.users.title')} — Admin`) })

interface AdminUser {
  id: string
  email: string
  name?: string | null
  role: 'user' | 'admin'
  createdAt: string
  _count: { favorites: number }
}

const page = ref(1)
const search = ref('')
const updatingId = ref<string | null>(null)
const toast = ref<{ ok: boolean; text: string } | null>(null)

const { data, refresh } = await useFetch<{ data: AdminUser[]; meta: { total: number; totalPages: number } }>(
  '/api/admin/users',
  { params: computed(() => ({ page: page.value, limit: 30, search: search.value || undefined })) },
)

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; refresh() }, 350)
})
watch(page, () => refresh())

const users = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function toggleRole(u: AdminUser) {
  const newRole = u.role === 'admin' ? 'user' : 'admin'
  const label = u.name || u.email
  const msg = newRole === 'admin'
    ? t('admin.users.confirmMakeAdmin', { name: label })
    : t('admin.users.confirmRemoveAdmin', { name: label })

  if (!confirm(msg)) return

  toast.value = null
  updatingId.value = u.id
  try {
    await $fetch(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: newRole } })
    toast.value = { ok: true, text: t('admin.users.roleUpdated') }
    refresh()
  } catch {
    toast.value = { ok: false, text: t('admin.users.roleError') }
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-serif text-2xl font-bold text-ink-900">{{ t('admin.users.title') }}</h1>
      <span class="text-sm text-ink-500">{{ data?.meta.total ?? 0 }} total</span>
    </div>

    <!-- Toast -->
    <Transition name="fade-down">
      <div
        v-if="toast"
        :class="toast.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'"
        class="mb-4 rounded-lg border px-4 py-2.5 text-sm"
      >
        {{ toast.text }}
      </div>
    </Transition>

    <!-- Search -->
    <div class="mb-4">
      <SearchBar v-model="search" :placeholder="t('admin.users.searchPlaceholder')" />
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead class="border-b border-ink-200 bg-ink-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">
              {{ t('admin.users.colName') }}
            </th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 md:table-cell">
              {{ t('admin.users.colEmail') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">
              {{ t('admin.users.colRole') }}
            </th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 lg:table-cell">
              {{ t('admin.users.colJoined') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">
              {{ t('admin.users.colActions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100 bg-white">
          <tr v-for="u in users" :key="u.id" class="hover:bg-ink-50">
            <!-- Name / email fallback -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">
                  {{ (u.name || u.email).slice(0, 2).toUpperCase() }}
                </span>
                <div>
                  <p class="font-medium text-ink-900">{{ u.name || '—' }}</p>
                  <p class="text-xs text-ink-500 md:hidden">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <!-- Email (hidden mobile) -->
            <td class="hidden px-4 py-3 text-ink-600 md:table-cell">{{ u.email }}</td>
            <!-- Role badge -->
            <td class="px-4 py-3">
              <span
                :class="u.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-ink-100 text-ink-500'"
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {{ u.role }}
              </span>
            </td>
            <!-- Joined date (hidden on mobile/tablet) -->
            <td class="hidden px-4 py-3 text-ink-500 lg:table-cell">{{ formatDate(u.createdAt) }}</td>
            <!-- Actions -->
            <td class="px-4 py-3">
              <button
                type="button"
                :disabled="updatingId === u.id"
                :class="u.role === 'admin' ? 'text-red-600 hover:bg-red-50' : 'text-gold-700 hover:bg-gold-50'"
                class="rounded px-2 py-1 text-xs transition disabled:opacity-50"
                @click="toggleRole(u)"
              >
                <template v-if="updatingId === u.id">{{ t('admin.users.updatingRole') }}</template>
                <template v-else-if="u.role === 'admin'">{{ t('admin.users.removeAdmin') }}</template>
                <template v-else>{{ t('admin.users.makeAdmin') }}</template>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!users.length" class="py-10 text-center text-sm text-ink-500">
        {{ t('admin.users.none') }}
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.2s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
