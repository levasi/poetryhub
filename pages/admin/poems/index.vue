<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
const { labelForTag } = useTagLabel()
useSeoMeta({ title: computed(() => t('seo.adminPoems')) })

const page    = ref(1)
const search  = ref('')
const deleting = ref<string | null>(null)

const { data, refresh } = await useFetch<{ data: Poem[]; meta: { total: number; totalPages: number } }>('/api/poems', {
  params: computed(() => ({ page: page.value, limit: 20, search: search.value || undefined })),
})

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; refresh() }, 350)
})

watch(page, () => refresh())

const poems      = computed(() => data.value?.data ?? [])
const meta       = computed(() => data.value?.meta)
const totalPages = computed(() => meta.value?.totalPages ?? 1)

async function deletePoem(slug: string) {
  if (!confirm(t('admin.poems.confirmDelete'))) return
  deleting.value = slug
  try {
    await $fetch(`/api/poems/${slug}`, { method: 'DELETE' })
    refresh()
  } catch (err) {
    alert((err as Error).message)
  } finally {
    deleting.value = null
  }
}
</script>

<template>
<div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">{{ t('admin.poems.title') }}</h1>
      <NuxtLink to="/admin/poems/new" class="ds-btn-primary">
        {{ t('admin.poems.new') }}
      </NuxtLink>
    </div>

    <div class="admin-page__search">
      <SearchBar v-model="search" :placeholder="t('admin.poems.searchPlaceholder')" />
    </div>

    <div class="admin-page__table-wrap">
      <table class="admin-page__table">
        <thead class="admin-page__thead">
          <tr>
            <th class="admin-page__th">{{ t('admin.poems.colTitle') }}</th>
            <th class="admin-page__th admin-page__th--md">{{ t('admin.poems.colAuthor') }}</th>
            <th class="admin-page__th admin-page__th--lg">{{ t('admin.poems.colTags') }}</th>
            <th class="admin-page__th">{{ t('admin.poems.colActions') }}</th>
          </tr>
        </thead>
        <tbody class="admin-page__tbody">
          <tr v-for="poem in poems" :key="poem.id">
            <td class="admin-page__td admin-page__td--truncate">
              <div class="admin-page__cell-row">
                <span v-if="poem.featured" class="admin-page__featured-dot" :title="t('admin.poems.featuredTitle')" />
                <span>{{ poem.title }}</span>
              </div>
            </td>
            <td class="admin-page__td admin-page__td--md">{{ poem.author.name }}</td>
            <td class="admin-page__td admin-page__td--lg">
              <div class="admin-page__tags">
                <span
                  v-for="pt in poem.poemTags?.slice(0, 3)"
                  :key="pt.tag.id"
                  class="admin-page__tag"
                >
                  {{ labelForTag(pt.tag.slug, pt.tag.name) }}
                </span>
              </div>
            </td>
            <td class="admin-page__td">
              <div class="admin-page__actions">
                <NuxtLink :to="`/admin/poems/${poem.slug}`" class="admin-page__action">
                  {{ t('admin.poems.edit') }}
                </NuxtLink>
                <NuxtLink
                  :to="poem.author?.slug
                    ? { path: `/authors/${poem.author.slug}`, query: { poem: poem.slug } }
                    : `/poems/${poem.slug}`"
                  target="_blank"
                  class="admin-page__action"
                >
                  {{ t('admin.poems.view') }}
                </NuxtLink>
                <button
                  type="button"
                  class="admin-page__action admin-page__action--danger"
                  :disabled="deleting === poem.slug"
                  @click="deletePoem(poem.slug)"
                >
                  {{ deleting === poem.slug ? t('admin.poems.deleting') : t('admin.poems.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!poems.length" class="admin-page__empty">
        {{ t('admin.poems.none') }}
      </div>
    </div>

    <div v-if="totalPages > 1" class="admin-page__pagination">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
