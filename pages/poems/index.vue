<script setup lang="ts">
/** Former browse page — keep route for bookmarks; send visitors to home (query preserved). */
const route = useRoute()
await navigateTo({ path: '/', query: { ...route.query } }, { redirectCode: 301 })
</script>
<template>
  <div class="min-h-[30vh]" />
</template>
