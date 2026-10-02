<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Poem } from '~/composables/usePoems'

defineProps<{
  poem: Poem
  liked: boolean
  copied: boolean
}>()

const emit = defineEmits<{
  favorite: []
  share: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="reader-mobile-actions">
    <div class="reader-mobile-actions__pill">
      <button
        type="button"
        class="ds-icon-btn reader-mobile-actions__btn"
        :class="{ 'reader-mobile-actions__btn--liked': liked }"
        :aria-label="liked ? t('viewer.saved') : t('viewer.savePoem')"
        @click="emit('favorite')"
      >
        <Icon
          :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
          class="reader-mobile-actions__icon"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        class="ds-icon-btn reader-mobile-actions__btn"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="emit('share')"
      >
        <Icon
          icon="heroicons:share"
          class="reader-mobile-actions__icon"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
