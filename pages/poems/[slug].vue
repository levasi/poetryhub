<script setup lang="ts">
/**
 * Canonical reading UI lives on `/authors/:authorSlug?poem=:slug`.
 * Keep `/poems/:slug` for bookmarks & external links → permanent redirect.
 */
import type { Poem } from '~/composables/usePoems'

const { t } = useI18n()
const route = useRoute()
const slug = route.params.slug as string

const { data: poem, error } = await useFetch<Poem>(`/api/poems/${slug}`)

if (error.value || !poem.value) {
  throw createError({ statusCode: 404, statusMessage: t('poem.notFound') })
}

const authorSlug = poem.value.author?.slug
if (!authorSlug) {
  throw createError({ statusCode: 404, statusMessage: t('poem.notFound') })
}

await navigateTo(
  {
    path: `/authors/${authorSlug}`,
    query: { ...route.query, poem: slug },
  },
  { redirectCode: 301 },
)
</script>

<template>
  <div class="min-h-[30vh]" />
</template>
