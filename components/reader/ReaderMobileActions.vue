<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

const props = defineProps<{
  poem: Poem
  liked: boolean
  copied: boolean
  showBibliography?: boolean
}>()

const emit = defineEmits<{
  favorite: []
  share: []
  bibliography: []
  readerSettings: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
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
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          :fill="liked ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      <button
        type="button"
        class="ds-icon-btn !min-h-11 !min-w-11 !rounded-full border-transparent"
        :aria-label="copied ? t('viewer.linkCopied') : t('viewer.sharePoem')"
        @click="emit('share')"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      <button
        v-if="showBibliography"
        type="button"
        class="ds-icon-btn !min-h-11 !min-w-11 !rounded-full border-transparent"
        :aria-label="t('viewer.openBibliography')"
        @click="emit('bibliography')"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <button
        type="button"
        class="ds-icon-btn !min-h-11 !min-w-11 !rounded-full border-transparent font-serif text-sm font-semibold"
        :aria-label="t('viewer.openReadingSettings')"
        @click="emit('readerSettings')"
      >
        Aa
      </button>
    </div>
  </div>
</template>
