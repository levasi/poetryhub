<script setup lang="ts">
const { t } = useI18n()
const { favoriteOpError, dismissFavoriteError } = useFavorites()
</script>

<template>
  <Teleport to="body">
    <Transition name="favorites-flash">
      <div
        v-if="favoriteOpError"
        class="ds-banner ds-banner-danger favorites-flash"
        role="alert"
      >
        <p class="favorites-flash__message">{{ favoriteOpError }}</p>
        <button
          type="button"
          class="favorites-flash__dismiss"
          @click="dismissFavoriteError"
        >
          {{ t('favorites.dismissError') }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
