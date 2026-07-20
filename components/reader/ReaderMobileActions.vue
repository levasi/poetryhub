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
  <div
    class="pointer-events-none fixed inset-x-0 z-40 flex justify-center p-4 md:hidden"
    style="bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px));"
  >
    <div
      class="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-edge-subtle bg-surface-overlay/95 px-2 py-1.5 shadow-ds-popover backdrop-blur-md"
    >
      <button
        type="button"
        class="ds-icon-btn !min-h-11 !min-w-11 !rounded-full border-transparent"
        :class="liked ? 'text-brand' : ''"
        :aria-label="liked ? t('viewer.saved') : t('viewer.savePoem')"
        @click="emit('favorite')"
      >
        <Icon
          :icon="liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
          class="h-5 w-5"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        class="ds-icon-btn !min-h-11 !min-w-11 !rounded-full border-transparent"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="emit('share')"
      >
        <Icon icon="heroicons:share" class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
