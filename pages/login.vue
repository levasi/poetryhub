<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.loginTitle')) })

const { login, loading, isLoggedIn, loginWithGoogle } = useAuth()
const route = useRoute()

const { data: googleConfig } = await useFetch<{ enabled: boolean }>('/api/auth/google-config', {
  key: 'auth-google-config',
})
const googleEnabled = computed(() => googleConfig.value?.enabled ?? false)

if (isLoggedIn.value) await navigateTo('/')

const form = reactive({ email: '', password: '' })
const error = ref('')
const showPassword = ref(false)

const GOOGLE_ERROR_KEYS: Record<string, string> = {
  google_denied: 'auth.googleErrorDenied',
  google_config: 'auth.googleErrorConfig',
  google_invalid: 'auth.googleErrorInvalid',
  google_state: 'auth.googleErrorState',
  google_token: 'auth.googleErrorToken',
  google_profile: 'auth.googleErrorProfile',
  google_unverified: 'auth.googleErrorUnverified',
}

const googleError = computed(() => {
  const e = route.query.error
  if (typeof e !== 'string' || !e.startsWith('google')) return ''
  return t(GOOGLE_ERROR_KEYS[e] ?? 'auth.googleErrorGeneric')
})

function startGoogle() {
  const redirect = (route.query.redirect as string) || '/'
  loginWithGoogle(redirect.startsWith('/') ? redirect : '/')
}

async function submit() {
  error.value = ''
  const result = await login(form.email, form.password)
  if (result.ok) {
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } else {
    error.value = result.message ?? t('auth.loginFailed')
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-surface-base px-4">
    <div class="absolute right-4 top-4 z-10">
      <LanguageSwitch />
    </div>

    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="font-serif text-2xl font-bold text-brand">
          Poetry<span class="text-content">Hub</span>
        </NuxtLink>
        <p class="mt-2 text-sm text-content-secondary">{{ t('auth.signInSubtitle') }}</p>
      </div>

      <div class="rounded-xl border border-edge-subtle bg-surface-raised p-8 shadow-ds-card">
        <p v-if="googleError" class="mb-4 rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">{{ googleError }}</p>

        <div v-if="googleEnabled" class="mb-4 space-y-4">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-edge-subtle bg-surface-subtle py-3 text-sm font-medium text-content transition hover:bg-surface-base"
            @click="startGoogle"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {{ t('auth.continueWithGoogle') }}
          </button>
          <div class="relative flex items-center gap-3 py-1">
            <div class="h-px flex-1 bg-edge-subtle" />
            <span class="text-xs uppercase tracking-widest text-content-soft">{{ t('auth.orContinueWith') }}</span>
            <div class="h-px flex-1 bg-edge-subtle" />
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="submit">
          <!-- Email -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
              {{ t('auth.email') }}
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-content-secondary">
              {{ t('auth.password') }}
            </label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.passwordPlaceholder')"
                required
                autocomplete="current-password"
                class="w-full rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-3 pr-11 text-sm text-content placeholder-content-soft outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-content-soft transition hover:text-content"
                :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">{{ error }}</p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="ds-btn-primary w-full justify-center py-3 text-sm disabled:opacity-50"
          >
            {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-content-secondary">
          {{ t('auth.noAccount') }}
          <NuxtLink to="/signup" class="font-medium text-brand underline-offset-2 hover:underline">{{ t('auth.signUpLink') }}</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
