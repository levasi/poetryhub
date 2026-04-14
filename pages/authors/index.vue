<script setup lang="ts">
/** Former authors browse page — redirect to home (query preserved for bookmarks). */
const route = useRoute()
await navigateTo({ path: '/', query: { ...route.query } }, { redirectCode: 301 })
</script>
<template>
  <div class="min-h-[30vh]" />
</template>
