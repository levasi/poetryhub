<script setup lang="ts">
const { t } = useI18n()
const isLoading = useState('page-loading', () => false)
</script>

<template>
  <Teleport to="body">
    <Transition name="page-loading-fade">
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-surface-page/85 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        :aria-label="t('a11y.loadingPage')"
      >
        <div class="flex flex-col items-center gap-5 px-6 text-center">
          <DsFleuron width="5rem" />
          <span
            class="h-8 w-8 animate-spin rounded-full border-2 border-edge-subtle border-t-brand"
            aria-hidden="true"
          />
          <p class="text-ui-sm font-medium text-content-muted">
            {{ t('a11y.loadingPage') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.page-loading-fade-enter-active,
.page-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-loading-fade-enter-from,
.page-loading-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-loading-fade-enter-active,
  .page-loading-fade-leave-active {
    transition: none;
  }
}
</style>
