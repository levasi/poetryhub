<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-lg border border-edge-subtle bg-surface-raised p-0.5 text-xs shadow-ds-card"
    role="group"
    :aria-label="$t('nav.language')"
  >
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      :class="[
        'rounded-md px-2 py-1 font-medium transition-colors',
        locale === l.code ? 'bg-brand text-brand-foreground' : 'text-content-muted hover:text-content',
      ]"
      :aria-pressed="locale === l.code"
      @click="setLocale(l.code)"
    >
      {{ l.code === 'ro' ? 'RO' : 'EN' }}
    </button>
  </div>
</template>
