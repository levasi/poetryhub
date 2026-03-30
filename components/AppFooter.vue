<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 w-full border-t border-ink-200 py-10">
    <div class="w-full px-4 md:px-6">
      <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
        <p class="font-serif text-sm italic text-ink-600">
          {{ t('footer.quote') }}
        </p>
        <div class="flex gap-6 text-xs text-ink-500">
          <NuxtLink to="/poems" class="hover:text-ink-800">{{ t('footer.poems') }}</NuxtLink>
          <NuxtLink to="/authors" class="hover:text-ink-800">{{ t('footer.authors') }}</NuxtLink>
          <NuxtLink to="/daily" class="hover:text-ink-800">{{ t('footer.dailyPoem') }}</NuxtLink>
          <NuxtLink to="/admin" class="hover:text-ink-800">{{ t('footer.admin') }}</NuxtLink>
        </div>
      </div>
      <p class="mt-4 text-center text-xs text-ink-400">{{ t('footer.copyright', { year }) }}</p>
    </div>
  </footer>
</template>
