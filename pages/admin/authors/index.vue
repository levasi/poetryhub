<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminAuthors')) })

const page     = ref(1)
const search   = ref('')
const deleting = ref<string | null>(null)

const { data, refresh } = await useFetch('/api/authors', {
  params: computed(() => ({ page: page.value, limit: 20, search: search.value || undefined })),
})

let timer: ReturnType<typeof setTimeout>
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; refresh() }, 350) })
watch(page,   () => refresh())

const authors    = computed(() => (data.value as { data: { id: string; name: string; slug: string; nationality: string | null; _count: { poems: number } }[] })?.data ?? [])
const meta       = computed(() => (data.value as { meta: { totalPages: number; total: number } })?.meta)
const totalPages = computed(() => meta.value?.totalPages ?? 1)

async function deleteAuthor(slug: string) {
  if (!confirm(t('admin.authors.confirmDelete'))) return
  deleting.value = slug
  try {
    await $fetch(`/api/authors/${slug}`, { method: 'DELETE' })
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
      <h1 class="admin-page__title">{{ t('admin.authors.title') }}</h1>
      <NuxtLink to="/admin/authors/new" class="admin-page__new-btn">
        {{ t('admin.authors.new') }}
      </NuxtLink>
    </div>

    <div class="admin-page__search">
      <SearchBar v-model="search" :placeholder="t('admin.authors.searchPlaceholder')" />
    </div>

    <div class="admin-page__table-wrap">
      <table class="admin-page__table">
        <thead class="admin-page__thead">
          <tr>
            <th class="admin-page__th">{{ t('admin.authors.colName') }}</th>
            <th class="admin-page__th admin-page__th--md">{{ t('admin.authors.colNationality') }}</th>
            <th class="admin-page__th admin-page__th--sm">{{ t('admin.authors.colPoems') }}</th>
            <th class="admin-page__th">{{ t('admin.authors.colActions') }}</th>
          </tr>
        </thead>
        <tbody class="admin-page__tbody">
          <tr v-for="author in authors" :key="author.id">
            <td class="admin-page__td admin-page__td--main">{{ author.name }}</td>
            <td class="admin-page__td admin-page__td--md">{{ author.nationality ?? '—' }}</td>
            <td class="admin-page__td admin-page__td--sm">{{ author._count?.poems ?? 0 }}</td>
            <td class="admin-page__td">
              <div class="admin-page__actions">
                <NuxtLink :to="`/admin/authors/${author.slug}`" class="admin-page__action">{{ t('admin.authors.edit') }}</NuxtLink>
                <button
                  type="button"
                  class="admin-page__action admin-page__action--danger"
                  :disabled="deleting === author.slug"
                  @click="deleteAuthor(author.slug)"
                >
                  {{ deleting === author.slug ? t('admin.poems.deleting') : t('admin.authors.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!authors.length" class="admin-page__empty">{{ t('admin.authors.none') }}</div>
    </div>

    <div v-if="totalPages > 1" class="admin-page__pagination">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
