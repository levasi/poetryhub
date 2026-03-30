<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-0.5 text-xs shadow-sm"
    role="group"
    :aria-label="$t('nav.language')"
  >
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      :class="[
        'rounded-md px-2 py-1 font-medium transition-colors',
        locale === l.code ? 'bg-gold-500 text-white' : 'text-ink-600 hover:text-ink-900',
      ]"
      :aria-pressed="locale === l.code"
      @click="setLocale(l.code)"
    >
      {{ l.code === 'ro' ? 'RO' : 'EN' }}
    </button>
  </div>
</template>
