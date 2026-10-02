<script setup lang="ts">
const { t } = useI18n()
const isLoading = useState('page-loading', () => false)
</script>

<template>
  <Teleport to="body">
    <Transition name="page-loading-fade">
      <div
        v-if="isLoading"
        class="page-loading"
        role="status"
        aria-live="polite"
        :aria-label="t('a11y.loadingPage')"
      >
        <div class="page-loading__inner">
          <DsFleuron width="5rem" />
          <span
            class="page-loading__spinner"
            aria-hidden="true"
          />
          <p class="page-loading__label">
            {{ t('a11y.loadingPage') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
