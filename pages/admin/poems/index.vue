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
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-serif text-2xl font-bold text-content">{{ t('admin.poems.title') }}</h1>
      <NuxtLink
        to="/admin/poems/new"
        class="ds-btn-primary px-4 py-2 text-sm"
      >
        {{ t('admin.poems.new') }}
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="mb-4 w-full">
      <SearchBar v-model="search" :placeholder="t('admin.poems.searchPlaceholder')" />
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-edge-subtle bg-surface-raised shadow-sm">
      <table class="w-full text-sm">
        <thead class="border-b border-edge-subtle bg-surface-subtle">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-content-muted">{{ t('admin.poems.colTitle') }}</th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-content-muted md:table-cell">{{ t('admin.poems.colAuthor') }}</th>
            <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-content-muted lg:table-cell">{{ t('admin.poems.colTags') }}</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-content-muted">{{ t('admin.poems.colActions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-edge-subtle bg-surface-raised">
          <tr v-for="poem in poems" :key="poem.id" class="hover:bg-surface-subtle">
            <td class="max-w-[280px] truncate px-4 py-3 font-medium text-content">
              <div class="flex items-center gap-2">
                <span v-if="poem.featured" class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" :title="t('admin.poems.featuredTitle')" />
                <span class="truncate">{{ poem.title }}</span>
              </div>
            </td>
            <td class="hidden px-4 py-3 text-content-muted md:table-cell">{{ poem.author.name }}</td>
            <td class="hidden px-4 py-3 lg:table-cell">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="pt in poem.poemTags?.slice(0, 3)"
                  :key="pt.tag.id"
                  class="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-content-muted"
                >
                  {{ labelForTag(pt.tag.slug, pt.tag.name) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/admin/poems/${poem.slug}`"
                  class="rounded px-2 py-1 text-xs text-content-muted hover:bg-surface-subtle hover:text-content"
                >
                  {{ t('admin.poems.edit') }}
                </NuxtLink>
                <NuxtLink
                  :to="poem.author?.slug
                    ? { path: `/authors/${poem.author.slug}`, query: { poem: poem.slug } }
                    : `/poems/${poem.slug}`"
                  target="_blank"
                  class="rounded px-2 py-1 text-xs text-content-muted hover:bg-surface-subtle hover:text-content"
                >
                  {{ t('admin.poems.view') }}
                </NuxtLink>
                <button
                  type="button"
                  class="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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

      <div v-if="!poems.length" class="py-10 text-center text-sm text-content-muted">
        {{ t('admin.poems.none') }}
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6">
      <PaginationNav :page="page" :total-pages="totalPages" @update:page="(p) => { page = p }" />
    </div>
  </div>
</template>
