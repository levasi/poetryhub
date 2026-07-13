<script setup lang="ts">
const { t } = useI18n()
const { favoriteOpError, dismissFavoriteError } = useFavorites()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="favoriteOpError"
        class="ds-banner ds-banner-danger fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex max-w-[min(100%-2rem,28rem)] -translate-x-1/2 items-center gap-3 shadow-ds-popover md:bottom-6 md:max-w-md"
        role="alert"
      >
        <p class="flex-1">{{ favoriteOpError }}</p>
        <button
          type="button"
          class="shrink-0 font-medium text-danger underline decoration-danger/40 underline-offset-2 hover:text-content"
          @click="dismissFavoriteError"
        >
          {{ t('favorites.dismissError') }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
