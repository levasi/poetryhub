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

// ── Poet account flag ───────────────────────────────────────────────────────
const poetEnabled = ref(!!user.value?.isPoet)
const poetLoading = ref(false)
const poetMsg = ref<{ ok: boolean; text: string } | null>(null)

watch(user, () => {
  poetEnabled.value = !!user.value?.isPoet
})

async function savePoetFlag(next: boolean) {
  poetMsg.value = null
  poetLoading.value = true
  try {
    const res = await $fetch<{ id: string; isPoet: boolean }>('/api/user/me/poet', {
      method: 'PATCH',
      body: { isPoet: next },
    })
    poetEnabled.value = res.isPoet
    if (user.value) user.value = { ...user.value, isPoet: res.isPoet }
    poetMsg.value = { ok: true, text: t('account.poetSaved') }
  } catch {
    poetEnabled.value = !!user.value?.isPoet
    poetMsg.value = { ok: false, text: t('account.poetError') }
  } finally {
    poetLoading.value = false
  }
}

function onPoetToggle(e: Event) {
  const next = (e.target as HTMLInputElement).checked
  void savePoetFlag(next)
}

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
  if (r === 'admin') return 'account-page__role-badge--admin'
  if (r === 'moderator') return 'account-page__role-badge--moderator'
  return 'account-page__role-badge--user'
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
  <div class="account-page">
    <div class="account-page__stack">
      <!-- ── Profile ──────────────────────────────────────────────────── -->
      <section
        class="account-page__card">
        <div class="account-page__card-head">
          <span
            class="account-page__card-icon">
            <svg class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <div>
            <h2 class="account-page__card-title">{{ t('account.profileSection') }}</h2>
            <p class="account-page__card-desc">{{ t('account.profileDesc') }}</p>
          </div>
        </div>

        <form class="account-page__form" @submit.prevent="saveProfile">
          <div>
            <label class="account-page__label">
              {{ t('account.nameLabel') }}
            </label>
            <input v-model="profileName" type="text" :placeholder="t('account.namePlaceholder')" maxlength="80"
              autocomplete="name" required
              class="account-page__input" />
          </div>

          <Transition name="msg">
            <p v-if="profileMsg" :class="profileMsg.ok ? 'account-page__msg--ok' : 'account-page__msg--err'"
              class="account-page__msg">
              {{ profileMsg.text }}
            </p>
          </Transition>

          <button type="submit" :disabled="profileLoading" class="ds-btn-primary disabled:opacity-50">
            {{ profileLoading ? t('account.savingProfile') : t('account.saveProfile') }}
          </button>
        </form>

        <div class="account-page__divider">
          <div class="account-page__poet-row">
            <div class="account-page__poet-copy">
              <p class="account-page__poet-title">{{ t('account.poetLabel') }}</p>
              <p class="account-page__poet-desc">{{ t('account.poetDesc') }}</p>
            </div>
            <label class="account-page__toggle">
              <input class="peer sr-only" type="checkbox" :checked="poetEnabled" :disabled="poetLoading"
                @change="onPoetToggle" />
              <span
                class="account-page__toggle-track"
                aria-hidden="true" />
              <span
                class="account-page__toggle-thumb"
                aria-hidden="true" />
            </label>
          </div>

          <Transition name="msg">
            <p v-if="poetMsg" :class="poetMsg.ok ? 'account-page__msg--ok' : 'account-page__msg--err'"
              class="account-page__msg account-page__msg--mt">
              {{ poetMsg.text }}
            </p>
          </Transition>
        </div>
      </section>

      <!-- ── Security ─────────────────────────────────────────────────── -->
      <!-- <section class="account-page__card">
      <div class="account-page__card-head">
        <span class="account-page__card-icon">
          <svg class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <div>
          <h2 class="account-page__card-title">{{ t('account.securitySection') }}</h2>
          <p class="account-page__card-desc">{{ t('account.securityDesc') }}</p>
          <p v-if="!hasPassword" class="mt-2 text-sm text-content-secondary">{{ t('account.googleOnlyPasswordHint') }}</p>
        </div>
      </div>

      <form class="account-page__form" @submit.prevent="savePassword">
        <div v-if="hasPassword">
          <label class="account-page__label">
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
              <svg v-if="!showCurrent" class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </div>
        </div>

        <div>
          <label class="account-page__label">
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
              <svg v-if="!showNew" class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </div>
        </div>

        <div>
          <label class="account-page__label">
            {{ t('account.confirmNewPassword') }}
          </label>
          <input
            v-model="pwForm.confirm"
            type="password"
            required
            autocomplete="new-password"
            class="account-page__input"
          />
        </div>

        <Transition name="msg">
          <p
            v-if="pwMsg"
            :class="pwMsg.ok ? 'bg-green-50 text-green-700' : 'bg-danger/10 text-danger'"
            class="account-page__msg"
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
    </section> -->

      <!-- ── Reading preferences ────────────────────────────────────────── -->
      <section
        class="account-page__card">
        <div class="account-page__card-head">
          <span
            class="account-page__card-icon">
            <svg class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          <div>
            <h2 class="account-page__card-title">{{ t('account.readingSection') }}</h2>
            <p class="account-page__card-desc">{{ t('account.readingDesc') }}</p>
          </div>
        </div>
  
        <div class="account-page__prefs">
          <div>
            <label class="account-page__label account-page__label--mb2">
              {{ t('nav.readingTheme') }}
            </label>
            <ColorSchemeSwatches variant="swatches" />
          </div>

          <div>
            <label class="account-page__label">{{
              t('viewer.font') }}</label>
            <select v-model="fontKey"
              class="account-page__input"
              @change="onReaderPreferenceChange">
              <option v-for="f in fontOptions" :key="f" :value="f">{{ t(READER_FONT_I18N_KEYS[f]) }}</option>
            </select>
          </div>

          <div>
            <div class="account-page__range-head">
              <label class="account-page__label">{{
                t('viewer.fontSize') }}</label>
              <span class="account-page__range-val">{{ fontSizePx }}px</span>
            </div>
            <input v-model.number="fontSizePx" type="range" min="16" max="48" step="1" class="account-page__range"
              @change="onReaderPreferenceChange" />
          </div>

          <div>
            <div class="account-page__range-head">
              <label class="account-page__label">{{
                t('viewer.lineHeight') }}</label>
              <span class="account-page__range-val">{{ lineHeight.toFixed(2) }}</span>
            </div>
            <input v-model.number="lineHeight" type="range" :min="READER_LINE_HEIGHT_MIN" :max="READER_LINE_HEIGHT_MAX"
              :step="READER_LINE_HEIGHT_STEP" class="account-page__range" @change="onReaderPreferenceChange" />
          </div>

          <div>
            <div class="account-page__range-head">
              <label class="account-page__label">{{
                t('viewer.letterSpacing') }}</label>
              <span class="account-page__range-val">{{ letterSpacingEm.toFixed(3) }}em</span>
            </div>
            <input v-model.number="letterSpacingEm" type="range" :min="READER_LETTER_SPACING_MIN"
              :max="READER_LETTER_SPACING_MAX" :step="READER_LETTER_SPACING_STEP" class="account-page__range"
              @change="onReaderPreferenceChange" />
          </div>

          <div class="account-page__preview" :style="{
            fontFamily: READER_FONT_STACKS[fontKey as ReaderFontKey],
            fontSize: `${fontSizePx}px`,
            lineHeight,
            letterSpacing: `${letterSpacingEm}em`,
          }">
            <span class="italic">"Two roads diverged in a yellow wood,<br />And sorry I could not travel both."</span>
          </div>
        </div>
      </section>

      <!-- ── Account info ───────────────────────────────────────────────── -->
      <section
        class="account-page__card">
        <div class="account-page__card-head">
          <span
            class="account-page__card-icon">
            <svg class="account-page__card-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h2 class="account-page__card-title">{{ t('account.accountInfo') }}</h2>
          </div>
        </div>
        <dl class="account-page__info-grid">
          <div class="account-page__info-cell">
            <dt class="account-page__info-dt">{{ t('account.emailLabel') }}
            </dt>
            <dd class="account-page__info-dd">{{ user?.email }}</dd>
          </div>
          <div class="account-page__info-cell">
            <dt class="account-page__info-dt">{{ t('account.roleLabel') }}</dt>
            <dd class="account-page__info-dd">
              <span class="account-page__role-badge"
                :class="roleBadgeClass">
                {{ roleDisplayName }}
              </span>
            </dd>
          </div>
          <div v-if="memberSince" class="account-page__info-cell">
            <dt class="account-page__info-dt">{{ t('account.memberSince') }}
            </dt>
            <dd class="account-page__info-dd">{{ memberSince }}</dd>
          </div>
        </dl>
      </section>

      <!-- ── Delete account ─────────────────────────────────────────────── -->
      <section class="account-page__card account-page__card--danger"
        :aria-label="t('account.deleteAccountSection')">
        <h2 class="account-page__card-title">{{ t('account.deleteAccountSection') }}</h2>
        <p class="account-page__card-desc account-page__card-desc--lead">
          {{ t('account.deleteAccountLead') }}
        </p>
        <p v-if="isSiteOwnerAccount" class="account-page__owner-note">
          {{ t('account.deleteAccountOwnerNote') }}
        </p>
        <button v-else type="button"
          class="account-page__delete-btn"
          @click="openDeleteModal">
          {{ t('account.deleteAccountButton') }}
        </button>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="deleteModalOpen" class="account-page__modal">
        <div class="account-page__modal-backdrop" aria-hidden="true" @click="closeDeleteModal" />
        <div role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
          class="account-page__modal-panel"
          @click.stop>
          <h3 id="delete-account-title" class="account-page__modal-title">
            {{ t('account.deleteAccountModalTitle') }}
          </h3>
          <p id="delete-account-desc" class="account-page__modal-desc">
            {{ hasPassword ? t('account.deleteAccountModalBody') : t('account.deleteAccountModalBodyGoogle') }}
          </p>
          <div class="account-page__modal-field">
            <label class="account-page__label">
              {{ hasPassword ? t('account.currentPassword') : t('account.deleteAccountConfirmEmailLabel') }}
            </label>
            <input v-model="deleteConfirmInput" :type="hasPassword ? 'password' : 'email'"
              :autocomplete="hasPassword ? 'current-password' : 'email'"
              class="account-page__input"
              @keydown.enter.prevent="confirmDeleteAccount" />
          </div>
          <p v-if="deleteError" class="account-page__modal-error">
            {{ deleteError }}
          </p>
          <div class="account-page__modal-actions">
            <button type="button" class="ds-btn-secondary ds-btn--sm" :disabled="deleteLoading"
              @click="closeDeleteModal">
              {{ t('account.deleteAccountCancel') }}
            </button>
            <button type="button"
              class="account-page__modal-confirm"
              :disabled="deleteLoading" @click="confirmDeleteAccount">
              {{ deleteLoading ? t('account.deleteAccountDeleting') : t('account.deleteAccountConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.msg-enter-active,
.msg-leave-active {
  transition: all 0.2s ease;
}

.msg-enter-from,
.msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
