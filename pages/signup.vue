<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.signupTitle')) })

const { register, loading, isLoggedIn } = useAuth()
const route = useRoute()

if (isLoggedIn.value) await navigateTo('/')

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const error = ref('')

async function submit() {
  error.value = ''

  if (form.password !== form.confirm) {
    error.value = t('auth.passwordMismatch')
    return
  }

  const result = await register(form.email, form.password, form.name || undefined)
  if (result.ok) {
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } else {
    error.value = result.message ?? t('auth.registerFailed')
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-ink-50 px-4">
    <div class="absolute right-4 top-4 z-10">
      <LanguageSwitch />
    </div>

    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="font-serif text-2xl font-bold text-gold-700">
          Poetry<span class="text-ink-900">Hub</span>
        </NuxtLink>
        <p class="mt-2 text-sm text-ink-600">{{ t('auth.signUpSubtitle') }}</p>
      </div>

      <form
        class="rounded-xl border border-ink-200 bg-white p-8 shadow-lg"
        @submit.prevent="submit"
      >
        <div class="space-y-5">
          <!-- Name -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">
              {{ t('auth.nameOptional') }}
            </label>
            <input
              v-model="form.name"
              type="text"
              :placeholder="t('auth.yourName')"
              autocomplete="name"
              class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">
              {{ t('auth.email') }}
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">
              {{ t('auth.password') }}
            </label>
            <input
              v-model="form.password"
              type="password"
              :placeholder="t('auth.passwordMin')"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            />
          </div>

          <!-- Confirm password -->
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">
              {{ t('auth.confirmPassword') }}
            </label>
            <input
              v-model="form.confirm"
              type="password"
              :placeholder="t('auth.repeatPassword')"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-gold-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-700 disabled:opacity-50"
          >
            {{ loading ? t('auth.creating') : t('auth.createAccount') }}
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-ink-600">
          {{ t('auth.haveAccount') }}
          <NuxtLink to="/login" class="text-gold-800 underline hover:text-gold-900">{{ t('auth.signInLink') }}</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
