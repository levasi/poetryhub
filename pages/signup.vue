<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: computed(() => t('seo.signupTitle')) })

const { isLoggedIn, loginWithGoogle } = useAuth()
const route = useRoute()

const { data: googleConfig } = await useFetch<{ enabled: boolean }>('/api/auth/google-config', {
  key: 'auth-google-config',
  getCachedData: () => undefined,
})
const googleEnabled = computed(() => googleConfig.value?.enabled ?? false)

if (isLoggedIn.value) await navigateTo('/')

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
</script>

<template>
  <AuthShell
    :title="t('auth.startReading')"
    :subtitle="t('auth.startReadingLead')"
    verse="A fost odată ca-n povești, a fost ca niciodată"
    attribution="MIHAI EMINESCU — LUCEAFĂRUL"
  >
    <DsBanner
      v-if="googleError"
      variant="danger"
      class="mb-4"
    >
      {{ googleError }}
    </DsBanner>

    <AuthGoogleButton
      v-if="googleEnabled"
      class="mb-2"
      @click="startGoogle"
    />

    <p class="mt-6 text-center text-sm text-content-secondary">
      {{ t('auth.haveAccount') }}
      <NuxtLink
        to="/login"
        class="font-medium text-brand underline-offset-2 hover:underline"
      >
        {{ t('auth.signInLink') }}
      </NuxtLink>
    </p>
  </AuthShell>
</template>
