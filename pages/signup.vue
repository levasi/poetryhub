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
      class="auth-page__banner"
    >
      {{ googleError }}
    </DsBanner>

    <AuthGoogleButton
      v-if="googleEnabled"
      class="auth-page__google"
      @click="startGoogle"
    />

    <p class="auth-page__footer">
      {{ t('auth.haveAccount') }}
      <NuxtLink
        to="/login"
        class="auth-page__link"
      >
        {{ t('auth.signInLink') }}
      </NuxtLink>
    </p>
  </AuthShell>
</template>
