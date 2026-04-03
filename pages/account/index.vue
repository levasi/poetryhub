<script setup lang="ts">
import {
  useReaderPreferences,
  READER_FONT_I18N_KEYS,
  READER_FONT_STACKS,
  READER_LINE_HEIGHT_MIN,
  READER_LINE_HEIGHT_MAX,
  READER_LINE_HEIGHT_STEP,
  READER_LETTER_SPACING_MIN,
  READER_LETTER_SPACING_MAX,
  READER_LETTER_SPACING_STEP,
  type ReaderFontKey,
} from '~/composables/useReaderPreferences'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

definePageMeta({ layout: 'account' })

const { t, locale } = useI18n()
const { user, fetchMe } = useAuth()
const { resetAfterAccountDeletion } = useFavorites()

useSeoMeta({ title: computed(() => t('seo.accountTitle')) })

// ── Profile ────────────────────────────────────────────────────────────────
const profileName = ref(user.value?.name ?? '')
const profileLoading = ref(false)
const profileMsg = ref<{ ok: boolean; text: string } | null>(null)

async function saveProfile() {
  profileMsg.value = null
  profileLoading.value = true
  try {
    const updated = await $fetch<{ id: string; email: string; name?: string }>('/api/user/me/profile', {
      method: 'PATCH',
      body: { name: profileName.value.trim() },
    })
    if (user.value) user.value = { ...user.value, name: updated.name }
    profileMsg.value = { ok: true, text: t('account.profileSaved') }
  } catch {
    profileMsg.value = { ok: false, text: t('account.profileError') }
  } finally {
    profileLoading.value = false
  }
}

// ── Security ────────────────────────────────────────────────────────────────
const pwForm = reactive({ current: '', next: '', confirm: '' })
const showCurrent = ref(false)
const showNew = ref(false)
const pwLoading = ref(false)
const pwMsg = ref<{ ok: boolean; text: string } | null>(null)

const hasPassword = computed(() => user.value?.hasPassword !== false)

async function savePassword() {
  pwMsg.value = null
  if (pwForm.next !== pwForm.confirm) {
    pwMsg.value = { ok: false, text: t('account.passwordNewMismatch') }
    return
  }
  if (hasPassword.value && !pwForm.current) {
    pwMsg.value = { ok: false, text: t('account.passwordError') }
    return
  }
  pwLoading.value = true
  try {
    const body: { newPassword: string; currentPassword?: string } = { newPassword: pwForm.next }
    if (hasPassword.value) body.currentPassword = pwForm.current
    await $fetch('/api/user/me/password', {
      method: 'PATCH',
      body,
    })
    pwMsg.value = { ok: true, text: t('account.passwordChanged') }
    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''
    await fetchMe()
  } catch {
    pwMsg.value = { ok: false, text: t('account.passwordError') }
  } finally {
    pwLoading.value = false
  }
}

// ── Reading preferences ─────────────────────────────────────────────────────
const {
  fontKey,
  fontSizePx,
  lineHeight,
  letterSpacingEm,
  onReaderPreferenceChange,
  fontOptions,
} = useReaderPreferences()

// ── Account info ────────────────────────────────────────────────────────────
const memberSince = computed(() => {
  const d = user.value?.createdAt
  if (!d) return null
  return new Date(d).toLocaleDateString(locale.value === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

const accountRole = computed(() => user.value?.role ?? 'user')

const roleDisplayName = computed(() => {
  const r = accountRole.value
  if (r === 'admin') return t('account.roleNames.admin')
  if (r === 'moderator') return t('account.roleNames.moderator')
  return t('account.roleNames.user')
})

const roleBadgeClass = computed(() => {
  const r = accountRole.value
  if (r === 'admin') return 'bg-gold-100 text-gold-800 ring-1 ring-gold-200/80'
  if (r === 'moderator') return 'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80'
  return 'bg-surface-subtle text-content-secondary ring-1 ring-edge-subtle'
})

const isSiteOwnerAccount = computed(
  () => user.value?.email?.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase(),
)

const deleteModalOpen = ref(false)
/** Password for accounts with a password; full email for Google-only accounts (API field name is still `password`). */
const deleteConfirmInput = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')

function openDeleteModal() {
  deleteError.value = ''
  deleteConfirmInput.value = ''
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  deleteConfirmInput.value = ''
  deleteError.value = ''
}

async function confirmDeleteAccount() {
  deleteError.value = ''
  if (hasPassword.value) {
    if (!deleteConfirmInput.value) {
      deleteError.value = t('account.deleteAccountPasswordRequired')
      return
    }
  } else {
    const trimmed = deleteConfirmInput.value.trim()
    if (!trimmed) {
      deleteError.value = t('account.deleteAccountEmailRequired')
      return
    }
  }
  deleteLoading.value = true
  try {
    await $fetch('/api/user/me', {
      method: 'DELETE',
      body: { password: deleteConfirmInput.value },
    })
    resetAfterAccountDeletion()
    user.value = null
    closeDeleteModal()
    await navigateTo('/')
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'statusCode' in err ? (err as { statusCode?: number }).statusCode : undefined
    const msg =
      code === 401
        ? hasPassword.value
          ? t('account.deleteAccountWrongPassword')
          : t('account.deleteAccountWrongEmail')
        : code === 403
          ? t('account.deleteAccountForbidden')
          : t('account.deleteAccountError')
    deleteError.value = msg
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && deleteModalOpen.value) closeDeleteModal()
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <header class="mb-10 border-b border-edge-subtle pb-8">
      <p class="ds-eyebrow mb-2 text-brand">{{ t('account.title') }}</p>
      <h1 class="font-serif text-3xl font-bold tracking-tight text-content md:text-4xl">
        {{ t('nav.account') }}
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-content-secondary">
        {{ t('account.pageSubtitle') }}
      </p>
    </header>

    <div class="space-y-8">
    <!-- ── Profile ──────────────────────────────────────────────────── -->
    <section class="rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card transition-shadow hover:shadow-ds-card-hover md:p-8">
      <div class="mb-6 flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft/35 text-brand">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        <div>
          <h2 class="font-serif text-lg font-semibold text-content">{{ t('account.profileSection') }}</h2>
          <p class="mt-1 text-sm text-content-secondary">{{ t('account.profileDesc') }}</p>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="saveProfile">
        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
            {{ t('account.nameLabel') }}
          </label>
          <input
            v-model="profileName"
            type="text"
            :placeholder="t('account.namePlaceholder')"
            maxlength="80"
            autocomplete="name"
            required
            class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <Transition name="msg">
          <p
            v-if="profileMsg"
            :class="profileMsg.ok ? 'bg-green-50 text-green-700' : 'bg-danger/10 text-danger'"
            class="rounded-lg px-4 py-2.5 text-sm"
          >
            {{ profileMsg.text }}
          </p>
        </Transition>

        <button type="submit" :disabled="profileLoading" class="ds-btn-primary disabled:opacity-50">
          {{ profileLoading ? t('account.savingProfile') : t('account.saveProfile') }}
        </button>
      </form>
    </section>

    <!-- ── Security ─────────────────────────────────────────────────── -->
    <section class="rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card transition-shadow hover:shadow-ds-card-hover md:p-8">
      <div class="mb-6 flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft/35 text-brand">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <div>
          <h2 class="font-serif text-lg font-semibold text-content">{{ t('account.securitySection') }}</h2>
          <p class="mt-1 text-sm text-content-secondary">{{ t('account.securityDesc') }}</p>
          <p v-if="!hasPassword" class="mt-2 text-sm text-content-secondary">{{ t('account.googleOnlyPasswordHint') }}</p>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="savePassword">
        <div v-if="hasPassword">
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
            {{ t('account.currentPassword') }}
          </label>
          <div class="relative">
            <input
              v-model="pwForm.current"
              :type="showCurrent ? 'text' : 'password'"
              required
              autocomplete="current-password"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 pr-11 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button type="button" tabindex="-1" class="absolute right-3 top-1/2 -translate-y-1/2 text-content-soft transition hover:text-content" @click="showCurrent = !showCurrent">
              <svg v-if="!showCurrent" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
            {{ t('account.newPassword') }}
          </label>
          <div class="relative">
            <input
              v-model="pwForm.next"
              :type="showNew ? 'text' : 'password'"
              :placeholder="t('account.newPasswordMin')"
              required
              minlength="6"
              autocomplete="new-password"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 pr-11 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button type="button" tabindex="-1" class="absolute right-3 top-1/2 -translate-y-1/2 text-content-soft transition hover:text-content" @click="showNew = !showNew">
              <svg v-if="!showNew" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
            {{ t('account.confirmNewPassword') }}
          </label>
          <input
            v-model="pwForm.confirm"
            type="password"
            required
            autocomplete="new-password"
            class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <Transition name="msg">
          <p
            v-if="pwMsg"
            :class="pwMsg.ok ? 'bg-green-50 text-green-700' : 'bg-danger/10 text-danger'"
            class="rounded-lg px-4 py-2.5 text-sm"
          >
            {{ pwMsg.text }}
          </p>
        </Transition>

        <button type="submit" :disabled="pwLoading" class="ds-btn-primary disabled:opacity-50">
          {{
            pwLoading
              ? t('account.savingPassword')
              : hasPassword
                ? t('account.savePassword')
                : t('account.setPassword')
          }}
        </button>
      </form>
    </section>

    <!-- ── Reading preferences ────────────────────────────────────────── -->
    <section class="rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card transition-shadow hover:shadow-ds-card-hover md:p-8">
      <div class="mb-6 flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft/35 text-brand">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </span>
        <div>
          <h2 class="font-serif text-lg font-semibold text-content">{{ t('account.readingSection') }}</h2>
          <p class="mt-1 text-sm text-content-secondary">{{ t('account.readingDesc') }}</p>
        </div>
      </div>

      <div class="space-y-5">
        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">{{ t('viewer.font') }}</label>
          <select v-model="fontKey" class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" @change="onReaderPreferenceChange">
            <option v-for="f in fontOptions" :key="f" :value="f">{{ t(READER_FONT_I18N_KEYS[f]) }}</option>
          </select>
        </div>

        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">{{ t('viewer.fontSize') }}</label>
            <span class="text-xs tabular-nums text-content-soft">{{ fontSizePx }}px</span>
          </div>
          <input v-model.number="fontSizePx" type="range" min="16" max="48" step="1" class="w-full accent-brand" @change="onReaderPreferenceChange" />
        </div>

        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">{{ t('viewer.lineHeight') }}</label>
            <span class="text-xs tabular-nums text-content-soft">{{ lineHeight.toFixed(2) }}</span>
          </div>
          <input v-model.number="lineHeight" type="range" :min="READER_LINE_HEIGHT_MIN" :max="READER_LINE_HEIGHT_MAX" :step="READER_LINE_HEIGHT_STEP" class="w-full accent-brand" @change="onReaderPreferenceChange" />
        </div>

        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">{{ t('viewer.letterSpacing') }}</label>
            <span class="text-xs tabular-nums text-content-soft">{{ letterSpacingEm.toFixed(3) }}em</span>
          </div>
          <input v-model.number="letterSpacingEm" type="range" :min="READER_LETTER_SPACING_MIN" :max="READER_LETTER_SPACING_MAX" :step="READER_LETTER_SPACING_STEP" class="w-full accent-brand" @change="onReaderPreferenceChange" />
        </div>

        <div
          class="rounded-lg border border-edge-subtle bg-surface-subtle px-5 py-4 text-content"
          :style="{
            fontFamily: READER_FONT_STACKS[fontKey as ReaderFontKey],
            fontSize: `${fontSizePx}px`,
            lineHeight,
            letterSpacing: `${letterSpacingEm}em`,
          }"
        >
          <span class="italic">"Two roads diverged in a yellow wood,<br />And sorry I could not travel both."</span>
        </div>
      </div>
    </section>

    <!-- ── Account info ───────────────────────────────────────────────── -->
    <section class="rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card transition-shadow hover:shadow-ds-card-hover md:p-8">
      <div class="mb-6 flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft/35 text-brand">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div>
          <h2 class="font-serif text-lg font-semibold text-content">{{ t('account.accountInfo') }}</h2>
        </div>
      </div>
      <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-ds-md border border-edge-subtle bg-surface-subtle/50 px-4 py-3">
          <dt class="text-xs font-medium uppercase tracking-wider text-content-soft">{{ t('account.emailLabel') }}</dt>
          <dd class="mt-1 break-all font-medium text-content">{{ user?.email }}</dd>
        </div>
        <div class="rounded-ds-md border border-edge-subtle bg-surface-subtle/50 px-4 py-3">
          <dt class="text-xs font-medium uppercase tracking-wider text-content-soft">{{ t('account.roleLabel') }}</dt>
          <dd class="mt-1">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
              :class="roleBadgeClass"
            >
              {{ roleDisplayName }}
            </span>
          </dd>
        </div>
        <div v-if="memberSince" class="rounded-ds-md border border-edge-subtle bg-surface-subtle/50 px-4 py-3">
          <dt class="text-xs font-medium uppercase tracking-wider text-content-soft">{{ t('account.memberSince') }}</dt>
          <dd class="mt-1 font-medium text-content">{{ memberSince }}</dd>
        </div>
      </dl>
    </section>

    <!-- ── Delete account ─────────────────────────────────────────────── -->
    <section
      class="rounded-ds-lg border border-danger/25 bg-danger/5 p-6 shadow-ds-card md:p-8"
      :aria-label="t('account.deleteAccountSection')"
    >
      <h2 class="font-serif text-lg font-semibold text-content">{{ t('account.deleteAccountSection') }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-content-secondary">
        {{ t('account.deleteAccountLead') }}
      </p>
      <p v-if="isSiteOwnerAccount" class="mt-3 text-sm text-content-muted">
        {{ t('account.deleteAccountOwnerNote') }}
      </p>
      <button
        v-else
        type="button"
        class="mt-4 rounded-ds-md border border-danger/40 bg-surface-raised px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
        @click="openDeleteModal"
      >
        {{ t('account.deleteAccountButton') }}
      </button>
    </section>
    </div>

    <Teleport to="body">
      <div
        v-if="deleteModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-content/40 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="closeDeleteModal"
        />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
          class="relative z-10 w-full max-w-md rounded-ds-lg border border-edge-subtle bg-surface-raised p-6 shadow-ds-card"
          @click.stop
        >
          <h3 id="delete-account-title" class="font-serif text-lg font-semibold text-content">
            {{ t('account.deleteAccountModalTitle') }}
          </h3>
          <p id="delete-account-desc" class="mt-2 text-sm leading-relaxed text-content-secondary">
            {{ hasPassword ? t('account.deleteAccountModalBody') : t('account.deleteAccountModalBodyGoogle') }}
          </p>
          <div class="mt-4">
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-content-secondary">
              {{ hasPassword ? t('account.currentPassword') : t('account.deleteAccountConfirmEmailLabel') }}
            </label>
            <input
              v-model="deleteConfirmInput"
              :type="hasPassword ? 'password' : 'email'"
              :autocomplete="hasPassword ? 'current-password' : 'email'"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              @keydown.enter.prevent="confirmDeleteAccount"
            />
          </div>
          <p v-if="deleteError" class="mt-3 text-sm text-danger">
            {{ deleteError }}
          </p>
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="ds-btn-secondary px-4 py-2 text-sm"
              :disabled="deleteLoading"
              @click="closeDeleteModal"
            >
              {{ t('account.deleteAccountCancel') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-ds-md bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="deleteLoading"
              @click="confirmDeleteAccount"
            >
              {{ deleteLoading ? t('account.deleteAccountDeleting') : t('account.deleteAccountConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.msg-enter-active, .msg-leave-active { transition: all 0.2s ease; }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
