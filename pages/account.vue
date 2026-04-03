<script setup lang="ts">
import {
  useReaderPreferences,
  READER_FONT_OPTIONS_ORDER,
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

const { t, locale } = useI18n()
const { user, logout } = useAuth()

useSeoMeta({ title: computed(() => t('seo.accountTitle')) })

// Redirect if not logged in
if (!user.value) await navigateTo('/login?redirect=/account')

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

async function savePassword() {
  pwMsg.value = null
  if (pwForm.next !== pwForm.confirm) {
    pwMsg.value = { ok: false, text: t('account.passwordNewMismatch') }
    return
  }
  pwLoading.value = true
  try {
    await $fetch('/api/user/me/password', {
      method: 'PATCH',
      body: { currentPassword: pwForm.current, newPassword: pwForm.next },
    })
    pwMsg.value = { ok: true, text: t('account.passwordChanged') }
    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const displayInitials = computed(() => {
  const n = user.value?.name || user.value?.email || '?'
  return n.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10 md:py-14">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-foreground"
      >
        {{ displayInitials }}
      </div>
      <div>
        <h1 class="text-2xl font-semibold text-content">{{ t('account.title') }}</h1>
        <p class="text-sm text-content-secondary">{{ user?.email }}</p>
      </div>
    </div>

    <div class="space-y-6">
      <!-- ── Profile ──────────────────────────────────────────────── -->
      <section class="rounded-xl border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
        <h2 class="mb-1 text-base font-semibold text-content">{{ t('account.profileSection') }}</h2>
        <p class="mb-5 text-sm text-content-secondary">{{ t('account.profileDesc') }}</p>

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
              :class="profileMsg.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-danger/10 text-danger'"
              class="rounded-lg px-4 py-2.5 text-sm"
            >
              {{ profileMsg.text }}
            </p>
          </Transition>

          <button
            type="submit"
            :disabled="profileLoading"
            class="ds-btn-primary disabled:opacity-50"
          >
            {{ profileLoading ? t('account.savingProfile') : t('account.saveProfile') }}
          </button>
        </form>
      </section>

      <!-- ── Security ─────────────────────────────────────────────── -->
      <section class="rounded-xl border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
        <h2 class="mb-1 text-base font-semibold text-content">{{ t('account.securitySection') }}</h2>
        <p class="mb-5 text-sm text-content-secondary">{{ t('account.securityDesc') }}</p>

        <form class="space-y-4" @submit.prevent="savePassword">
          <!-- Current password -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
              {{ t('account.currentPassword') }}
            </label>
            <div class="relative">
              <input
                v-model="pwForm.current"
                :type="showCurrent ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 pr-11 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-content-soft transition hover:text-content"
                @click="showCurrent = !showCurrent"
              >
                <svg v-if="!showCurrent" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- New password -->
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
                class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 pr-11 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-content-soft transition hover:text-content"
                @click="showNew = !showNew"
              >
                <svg v-if="!showNew" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm new password -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
              {{ t('account.confirmNewPassword') }}
            </label>
            <input
              v-model="pwForm.confirm"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <Transition name="msg">
            <p
              v-if="pwMsg"
              :class="pwMsg.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-danger/10 text-danger'"
              class="rounded-lg px-4 py-2.5 text-sm"
            >
              {{ pwMsg.text }}
            </p>
          </Transition>

          <button
            type="submit"
            :disabled="pwLoading"
            class="ds-btn-primary disabled:opacity-50"
          >
            {{ pwLoading ? t('account.savingPassword') : t('account.savePassword') }}
          </button>
        </form>
      </section>

      <!-- ── Reading preferences ────────────────────────────────────── -->
      <section class="rounded-xl border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
        <h2 class="mb-1 text-base font-semibold text-content">{{ t('account.readingSection') }}</h2>
        <p class="mb-5 text-sm text-content-secondary">{{ t('account.readingDesc') }}</p>

        <div class="space-y-5">
          <!-- Font -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
              {{ t('viewer.font') }}
            </label>
            <select
              v-model="fontKey"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              @change="onReaderPreferenceChange"
            >
              <option v-for="f in fontOptions" :key="f" :value="f">
                {{ t(READER_FONT_I18N_KEYS[f]) }}
              </option>
            </select>
          </div>

          <!-- Font size -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">
                {{ t('viewer.fontSize') }}
              </label>
              <span class="text-xs tabular-nums text-content-soft">{{ fontSizePx }}px</span>
            </div>
            <input
              v-model.number="fontSizePx"
              type="range"
              min="16"
              max="48"
              step="1"
              class="w-full accent-brand"
              @change="onReaderPreferenceChange"
            />
          </div>

          <!-- Line height -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">
                {{ t('viewer.lineHeight') }}
              </label>
              <span class="text-xs tabular-nums text-content-soft">{{ lineHeight.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="lineHeight"
              type="range"
              :min="READER_LINE_HEIGHT_MIN"
              :max="READER_LINE_HEIGHT_MAX"
              :step="READER_LINE_HEIGHT_STEP"
              class="w-full accent-brand"
              @change="onReaderPreferenceChange"
            />
          </div>

          <!-- Letter spacing -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium uppercase tracking-widest text-content-secondary">
                {{ t('viewer.letterSpacing') }}
              </label>
              <span class="text-xs tabular-nums text-content-soft">{{ letterSpacingEm.toFixed(3) }}em</span>
            </div>
            <input
              v-model.number="letterSpacingEm"
              type="range"
              :min="READER_LETTER_SPACING_MIN"
              :max="READER_LETTER_SPACING_MAX"
              :step="READER_LETTER_SPACING_STEP"
              class="w-full accent-brand"
              @change="onReaderPreferenceChange"
            />
          </div>

          <!-- Live preview -->
          <div
            class="rounded-lg border border-edge-subtle bg-surface-subtle px-5 py-4 text-content"
            :style="{
              fontFamily: READER_FONT_STACKS[fontKey as ReaderFontKey],
              fontSize: `${fontSizePx}px`,
              lineHeight: lineHeight,
              letterSpacing: `${letterSpacingEm}em`,
            }"
          >
            <span class="italic">
              "Two roads diverged in a yellow wood,<br />
              And sorry I could not travel both."
            </span>
          </div>
        </div>
      </section>

      <!-- ── Account info + sign out ────────────────────────────────── -->
      <section class="rounded-xl border border-edge-subtle bg-surface-raised p-6 shadow-ds-card">
        <h2 class="mb-4 text-base font-semibold text-content">{{ t('account.accountInfo') }}</h2>
        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-content-secondary">{{ t('account.emailLabel') }}</dt>
            <dd class="font-medium text-content">{{ user?.email }}</dd>
          </div>
          <div v-if="memberSince" class="flex items-center justify-between gap-4">
            <dt class="text-content-secondary">{{ t('account.memberSince') }}</dt>
            <dd class="font-medium text-content">{{ memberSince }}</dd>
          </div>
        </dl>

        <div class="mt-6 border-t border-edge-subtle pt-5">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg border border-edge-subtle px-4 py-2.5 text-sm text-content-secondary transition hover:border-danger/50 hover:bg-danger/5 hover:text-danger"
            @click="logout"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ t('account.signOut') }}
          </button>
        </div>
      </section>
    </div>
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
