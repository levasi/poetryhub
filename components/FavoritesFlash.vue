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
        class="fixed bottom-6 left-1/2 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-ds-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-lg"
        role="alert"
      >
        <p class="flex-1">{{ favoriteOpError }}</p>
        <button
          type="button"
          class="shrink-0 font-medium text-rose-800 underline decoration-rose-400 underline-offset-2 hover:text-rose-950"
          @click="dismissFavoriteError"
        >
          {{ t('favorites.dismissError') }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
