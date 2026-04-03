<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.loginTitle')) })

const { login, loading, isLoggedIn } = useAuth()
const route = useRoute()

if (isLoggedIn.value) await navigateTo('/')

const form = reactive({ email: '', password: '' })
const error = ref('')
const showPassword = ref(false)

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

      <form
        class="rounded-xl border border-edge-subtle bg-surface-raised p-8 shadow-ds-card"
        @submit.prevent="submit"
      >
        <div class="space-y-5">
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
        </div>

        <p class="mt-6 text-center text-sm text-content-secondary">
          {{ t('auth.noAccount') }}
          <NuxtLink to="/signup" class="font-medium text-brand underline-offset-2 hover:underline">{{ t('auth.signUpLink') }}</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
