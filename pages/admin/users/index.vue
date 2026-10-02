<script setup lang="ts">
import type { Role } from '~/utils/roles'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t, locale } = useI18n()
useSeoMeta({ title: computed(() => `${t('admin.users.title')} — Admin`) })

interface AdminUser {
  id: string
  email: string
  name?: string | null
  role: Role
  createdAt: string
  _count: { favorites: number }
}

const page = ref(1)
const search = ref('')
const updatingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const toast = ref<{ ok: boolean; text: string } | null>(null)

const { data: adminSession } = await useFetch<{ id: string; email: string }>('/api/auth/me')

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

function isOwnerAccount(email: string) {
  return email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()
}

async function onRoleSelect(u: AdminUser, ev: Event) {
  const el = ev.target as HTMLSelectElement
  const newRole = el.value as Role
  if (newRole === u.role) return

  const label = u.name || u.email
  const roleLabel = t(`admin.users.roleLabels.${newRole}`)
  if (!confirm(t('admin.users.confirmRoleChange', { name: label, role: roleLabel }))) {
    el.value = u.role
    return
  }

  toast.value = null
  updatingId.value = u.id
  try {
    await $fetch(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: newRole } })
    toast.value = { ok: true, text: t('admin.users.roleUpdated') }
    await refresh()
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { statusMessage?: string } }).data?.statusMessage
        : undefined
    toast.value = { ok: false, text: msg || t('admin.users.roleError') }
    el.value = u.role
  } finally {
    updatingId.value = null
  }
}

async function onDeleteUser(u: AdminUser) {
  if (u.id === adminSession.value?.id || isOwnerAccount(u.email)) return
  const label = u.name || u.email
  if (!confirm(t('admin.users.deleteConfirm', { name: label }))) return

  toast.value = null
  deletingId.value = u.id
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    toast.value = { ok: true, text: t('admin.users.userDeleted') }
    await refresh()
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { statusMessage?: string } }).data?.statusMessage
        : undefined
    toast.value = { ok: false, text: msg || t('admin.users.deleteError') }
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
<div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">{{ t('admin.users.title') }}</h1>
      <span class="admin-page__meta">{{ data?.meta.total ?? 0 }} total</span>
    </div>

    <Transition name="fade-down">
      <div
        v-if="toast"
        :class="toast.ok ? 'admin-page__toast--ok' : 'admin-page__toast--err'"
        class="admin-page__toast"
      >
        {{ toast.text }}
      </div>
    </Transition>

    <div class="admin-page__search">
      <SearchBar v-model="search" :placeholder="t('admin.users.searchPlaceholder')" />
    </div>

    <div class="admin-page__table-wrap">
      <table class="admin-page__table">
        <thead class="admin-page__thead">
          <tr>
            <th class="admin-page__th">
              {{ t('admin.users.colName') }}
            </th>
            <th class="admin-page__th admin-page__th--md">
              {{ t('admin.users.colEmail') }}
            </th>
            <th class="admin-page__th">
              {{ t('admin.users.colRole') }}
            </th>
            <th class="admin-page__th admin-page__th--lg">
              {{ t('admin.users.colJoined') }}
            </th>
            <th class="admin-page__th admin-page__th--right">
              {{ t('admin.users.colActions') }}
            </th>
          </tr>
        </thead>
        <tbody class="admin-page__tbody">
          <tr v-for="u in users" :key="u.id" >
            <td class="admin-page__td">
              <div class="admin-page__cell-row">
                <span class="admin-page__avatar">
                  {{ (u.name || u.email).slice(0, 2).toUpperCase() }}
                </span>
                <div>
                  <p class="admin-page__link-title">{{ u.name || '—' }}</p>
                  <p class="admin-page__email-mobile">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="admin-page__td admin-page__td--md">{{ u.email }}</td>
            <td class="admin-page__td">
              <select
                :value="u.role"
                class="admin-input admin-input--compact"
                :disabled="updatingId === u.id || u.id === adminSession?.id || isOwnerAccount(u.email)"
                :title="
                  u.id === adminSession?.id
                    ? t('admin.users.cannotChangeSelf')
                    : isOwnerAccount(u.email)
                      ? t('admin.users.ownerNote')
                      : undefined
                "
                @change="onRoleSelect(u, $event)"
              >
                <option value="user">{{ t('admin.users.roleLabels.user') }}</option>
                <option value="editor">{{ t('admin.users.roleLabels.editor') }}</option>
                <option value="moderator">{{ t('admin.users.roleLabels.moderator') }}</option>
                <option value="admin">{{ t('admin.users.roleLabels.admin') }}</option>
              </select>
              <p v-if="isOwnerAccount(u.email)" class="admin-page__owner-note">
                {{ t('admin.users.ownerNote') }}
              </p>
            </td>
            <td class="admin-page__td admin-page__td--lg">{{ formatDate(u.createdAt) }}</td>
            <td class="admin-page__td admin-page__td--right">
              <button
                type="button"
                class="admin-page__action admin-page__action--danger"
                :disabled="
                  deletingId === u.id ||
                  updatingId === u.id ||
                  u.id === adminSession?.id ||
                  isOwnerAccount(u.email)
                "
                :title="
                  u.id === adminSession?.id
                    ? t('admin.users.deleteCannotSelf')
                    : isOwnerAccount(u.email)
                      ? t('admin.users.deleteCannotOwner')
                      : t('admin.users.delete')
                "
                @click="onDeleteUser(u)"
              >
                {{ deletingId === u.id ? t('admin.users.deleting') : t('admin.users.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!users.length" class="admin-page__empty">
        {{ t('admin.users.none') }}
      </div>
    </div>

    <div v-if="totalPages > 1" class="admin-page__pagination">
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
