<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  verse: string
  attribution: string
}>()

const { showLanguageSwitch } = useSiteSettings()
</script>

<template>
  <div class="auth-shell">
    <div class="auth-shell__mobile-verse">
      <p class="auth-shell__mobile-quote">
        {{ verse }}
      </p>
      <p class="ds-eyebrow auth-shell__mobile-attr">
        {{ attribution }}
      </p>
    </div>

    <div class="auth-shell__form-col">
      <div class="auth-shell__lang">
        <LanguageSwitch v-if="showLanguageSwitch" />
      </div>

      <div class="auth-shell__form-inner">
        <div class="auth-shell__brand">
          <NuxtLink
            to="/"
            class="auth-shell__logo-link"
          >
            <AppLogo />
          </NuxtLink>
          <h1 class="auth-shell__title">
            {{ title }}
          </h1>
          <p class="auth-shell__subtitle">
            {{ subtitle }}
          </p>
        </div>

        <div class="auth-shell__card">
          <slot />
        </div>

        <div class="auth-shell__back-wrap">
          <NuxtLink
            to="/"
            class="auth-shell__back"
          >
            <svg
              class="auth-shell__back-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {{ $t('auth.backToSite') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="auth-shell__desktop-verse">
      <div class="auth-shell__desktop-inner">
        <DsFleuron
          width="6rem"
          class="auth-shell__desktop-fleuron"
        />
        <p class="auth-shell__desktop-quote">
          {{ verse }}
        </p>
        <div class="auth-shell__desktop-rule" />
        <p class="ds-eyebrow auth-shell__desktop-attr">
          {{ attribution }}
        </p>
      </div>
    </div>
  </div>
</template>
