<script setup lang="ts">
import { useDailyPoem } from '~/composables/usePoems'

const { t, locale } = useI18n()

useSeoMeta({ title: computed(() => t('seo.dailyTitle')) })

const { data: poem, error } = await useDailyPoem()

const dateLabel = computed(() =>
  new Date().toLocaleDateString(locale.value === 'ro' ? 'ro-RO' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
)

const badgeText = computed(() => t('daily.badge', { date: dateLabel.value }))
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-4 flex items-center gap-2">
      <span class="inline-block h-2 w-2 rounded-full bg-gold-500 animate-pulse-soft" />
      <span class="text-xs font-semibold uppercase tracking-widest text-brand">
        {{ badgeText }}
      </span>
    </div>

    <div v-if="poem">
      <PoetryViewer :poem="poem" />
    </div>

    <div v-else class="py-24 text-center text-content-muted">
      <p class="font-serif text-xl">{{ t('daily.empty') }}</p>
      <NuxtLink to="/poems" class="mt-4 inline-block text-sm underline hover:text-content">
        {{ t('daily.browse') }}
      </NuxtLink>
    </div>
  </div>
</template>
