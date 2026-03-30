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
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-serif text-2xl font-bold text-ink-900">{{ t('admin.authors.title') }}</h1>
      <NuxtLink to="/admin/authors/new" class="rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold-700">
        {{ t('admin.authors.new') }}
      </NuxtLink>
    </div>

    <div class="mb-4 w-full">
      <SearchBar v-model="search" :placeholder="t('admin.authors.searchPlaceholder')" />
    </div>

    <div class="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead class="border-b border-ink-200 bg-ink-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">{{ t('admin.authors.colName') }}</th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 md:table-cell">{{ t('admin.authors.colNationality') }}</th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 sm:table-cell">{{ t('admin.authors.colPoems') }}</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">{{ t('admin.authors.colActions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100 bg-white">
          <tr v-for="author in authors" :key="author.id" class="hover:bg-ink-50">
            <td class="px-4 py-3 font-medium text-ink-900">{{ author.name }}</td>
            <td class="hidden px-4 py-3 text-ink-600 md:table-cell">{{ author.nationality ?? '—' }}</td>
            <td class="hidden px-4 py-3 text-ink-600 sm:table-cell">{{ author._count?.poems ?? 0 }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <NuxtLink :to="`/admin/authors/${author.slug}`" class="rounded px-2 py-1 text-xs text-ink-600 hover:bg-ink-100 hover:text-ink-900">{{ t('admin.authors.edit') }}</NuxtLink>
                <button
                  type="button"
                  class="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
      <div v-if="!authors.length" class="py-10 text-center text-sm text-ink-500">{{ t('admin.authors.none') }}</div>
    </div>

    <div v-if="totalPages > 1" class="mt-6">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
