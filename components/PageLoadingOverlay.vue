<script setup lang="ts">
const { t } = useI18n()
const isLoading = useState('page-loading', () => false)
const writeBootLoading = useState('write-boot-loading', () => false)

const showOverlay = computed(() => isLoading.value || writeBootLoading.value)
const overlayLabel = computed(() =>
  writeBootLoading.value ? t('write.loadingWorkspace') : t('a11y.loadingPage'),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="page-loading-fade">
      <div
        v-if="showOverlay"
        class="page-loading"
        role="status"
        aria-live="polite"
        :aria-label="overlayLabel"
      >
        <div class="page-loading__inner">
          <DsFleuron width="5rem" />
          <span
            class="page-loading__spinner"
            aria-hidden="true"
          />
          <p class="page-loading__label">
            {{ overlayLabel }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
