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
  <div class="flex min-h-screen flex-col bg-surface-page lg:flex-row">
    <div
      class="border-b border-edge-subtle bg-[#0e0e0c] px-4 py-8 text-center lg:hidden"
    >
      <p class="font-serif text-lg italic leading-relaxed text-[#f8f6f0]/90">
        {{ verse }}
      </p>
      <p class="ds-eyebrow mt-4 !mb-0 text-brand">
        {{ attribution }}
      </p>
    </div>

    <div class="relative flex flex-1 items-center justify-center px-4 py-10 lg:max-w-lg lg:px-10 xl:max-w-xl">
      <div class="absolute right-4 top-4 z-10">
        <LanguageSwitch v-if="showLanguageSwitch" />
      </div>

      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <NuxtLink
            to="/"
            class="inline-flex justify-center"
          >
            <AppLogo />
          </NuxtLink>
          <h1 class="mt-6 font-serif text-2xl font-semibold tracking-tight text-content">
            {{ title }}
          </h1>
          <p class="mt-2 text-sm text-content-secondary">
            {{ subtitle }}
          </p>
        </div>

        <div class="rounded-ds-lg border border-edge-subtle bg-surface-raised p-8 shadow-ds-card">
          <slot />
        </div>

        <div class="mt-6 flex justify-center">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-content-secondary transition hover:text-content"
          >
            <svg
              class="h-4 w-4 shrink-0"
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

    <div
      class="relative hidden flex-1 items-center justify-center bg-[#0e0e0c] px-12 lg:flex"
    >
      <div class="max-w-md text-center">
        <DsFleuron
          width="6rem"
          class="mb-10 opacity-60"
        />
        <p class="font-serif text-[clamp(1.5rem,3vw,2.25rem)] italic leading-[1.55] text-[#f8f6f0]">
          {{ verse }}
        </p>
        <div class="mx-auto mt-10 h-px w-24 bg-brand/40" />
        <p class="ds-eyebrow mt-6 !mb-0 text-brand">
          {{ attribution }}
        </p>
      </div>
    </div>
  </div>
</template>
