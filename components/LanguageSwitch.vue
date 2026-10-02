<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <div
    class="language-switch"
    role="group"
    :aria-label="$t('nav.language')"
  >
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      class="language-switch__btn"
      :class="{ 'language-switch__btn--active': locale === l.code }"
      :aria-pressed="locale === l.code"
      @click="setLocale(l.code)"
    >
      {{ l.code === 'ro' ? 'RO' : 'EN' }}
    </button>
  </div>
</template>
