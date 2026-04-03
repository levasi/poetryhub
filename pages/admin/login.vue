<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminLogin')) })

const { login, loading } = useAdmin()
const route  = useRoute()
const router = useRouter()

const email    = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  const result = await login(email.value, password.value)
  if (result.ok) {
    const redirect = (route.query.redirect as string) || '/admin'
    router.push(redirect)
  } else {
    errorMsg.value = result.message ?? t('admin.login.failed')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-ink-50 px-4">
    <div class="w-full">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="font-serif text-2xl font-bold">
          <span class="text-gold-700">Poetry</span><span class="text-ink-900">Hub</span>
        </NuxtLink>
        <p class="mt-1 text-sm text-ink-600">{{ t('admin.login.subtitle') }}</p>
      </div>

      <!-- Card -->
      <form
        class="rounded-2xl border border-ink-200 bg-white p-8 shadow-lg"
        @submit.prevent="handleLogin"
      >
        <h1 class="mb-6 font-serif text-xl font-bold text-ink-900">{{ t('admin.login.title') }}</h1>

        <!-- Error -->
        <div v-if="errorMsg" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ errorMsg }}
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.login.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            placeholder="admin@poetryhub.com"
          />
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.login.password') }}</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
            :placeholder="t('admin.login.passwordPlaceholder')"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-gold-600 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-gold-700 disabled:opacity-50"
        >
          {{ loading ? t('admin.login.signingIn') : t('admin.login.signIn') }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-ink-500">
        <NuxtLink to="/" class="hover:text-ink-800">{{ t('admin.backToSite') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
