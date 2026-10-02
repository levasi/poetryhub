<script setup lang="ts">
/** Former authors browse page — redirect to home (query preserved for bookmarks). */
const route = useRoute()
await navigateTo({ path: '/descopera', query: { ...route.query } }, { redirectCode: 301 })
</script>
<template>
  <div class="author-page__stub" />
</template>
