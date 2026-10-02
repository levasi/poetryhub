<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
const { labelForTag } = useTagLabel()

const route   = useRoute()
const router  = useRouter()
const slug    = route.params.slug as string
const loading = ref(false)
const error   = ref('')

const { data: poem } = await useFetch<Poem>(`/api/poems/${slug}`)
if (!poem.value) throw createError({ statusCode: 404 })

useSeoMeta({ title: computed(() => t('seo.adminEditPoem', { title: poem.value?.title ?? '' })) })

const { data: authors } = await useFetch('/api/authors', { params: { limit: 200 } })
const { data: tags }    = await useFetch('/api/tags')

const form = reactive({
  title:     poem.value?.title     ?? '',
  content:   poem.value?.content   ?? '',
  authorId:  poem.value?.authorId  ?? '',
  language:  poem.value?.language  ?? 'en',
  source:    poem.value?.source    ?? 'classic',
  sourceUrl: poem.value?.sourceUrl ?? '',
  featured:  poem.value?.featured  ?? false,
  tagIds:    poem.value?.poemTags?.map((pt) => pt.tag.id) ?? [],
})

function toggleTag(id: string) {
  const i = form.tagIds.indexOf(id)
  if (i === -1) form.tagIds.push(id)
  else           form.tagIds.splice(i, 1)
}

async function submit() {
  loading.value = true
  error.value   = ''
  try {
    await $fetch(`/api/poems/${slug}`, { method: 'PUT', body: form })
    router.push('/admin/poems')
  } catch (err: unknown) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? t('admin.poemForm.updateFailed')
  } finally {
    loading.value = false
  }
}

async function deletePoem() {
  if (!confirm(t('admin.poemForm.deleteConfirm'))) return
  await $fetch(`/api/poems/${slug}`, { method: 'DELETE' })
  router.push('/admin/poems')
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <div class="admin-page__cell-row" style="flex:1;min-width:0">
        <NuxtLink to="/admin/poems" class="admin-page__back">{{ t('admin.poemForm.backPoems') }}</NuxtLink>
        <h1 class="admin-page__title admin-page__title--truncate">{{ t('admin.poemForm.editTitle', { title: form.title }) }}</h1>
      </div>
      <button type="button" class="admin-page__action admin-page__action--danger" @click="deletePoem">{{ t('admin.poemForm.delete') }}</button>
    </div>

    <form class="admin-page__form" @submit.prevent="submit">
      <div v-if="error" class="admin-page__error">{{ error }}</div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.title') }}</label>
        <input v-model="form.title" type="text" required class="admin-input" />
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.author') }}</label>
        <select v-model="form.authorId" required class="admin-input">
          <option v-for="a in (authors as { data: { id: string; name: string }[] })?.data" :key="a.id" :value="a.id">
            {{ a.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.content') }}</label>
        <textarea v-model="form.content" rows="14" required class="admin-input admin-input--mono" />
      </div>

      <div class="admin-page__year-grid">
        <div>
          <label class="admin-page__field-label">{{ t('admin.poemForm.language') }}</label>
          <select v-model="form.language" class="admin-input">
            <option value="en">{{ t('lang.en') }}</option>
            <option value="ro">{{ t('lang.ro') }}</option>
            <option value="fr">{{ t('lang.fr') }}</option>
            <option value="de">{{ t('lang.de') }}</option>
            <option value="es">{{ t('lang.es') }}</option>
            <option value="ru">{{ t('lang.ru') }}</option>
          </select>
        </div>
        <div>
          <label class="admin-page__field-label">{{ t('admin.poemForm.source') }}</label>
          <select v-model="form.source" class="admin-input">
            <option value="classic">{{ t('admin.poemForm.sources.classic') }}</option>
            <option value="user-submitted">{{ t('admin.poemForm.sources.user') }}</option>
            <option value="imported">{{ t('admin.poemForm.sources.imported') }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.sourceUrl') }}</label>
        <input v-model="form.sourceUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <div v-if="(tags as unknown[])?.length">
        <label class="admin-page__field-label">{{ t('admin.poemForm.tags') }}</label>
        <div class="admin-page__tag-row">
          <button
            v-for="tag in (tags as { id: string; name: string }[])"
            :key="tag.id"
            type="button"
            class="admin-page__tag-chip"
            :class="form.tagIds.includes(tag.id) ? 'admin-page__tag-chip--active' : ''"
            @click="toggleTag(tag.id)"
          >
            {{ labelForTag(tag.slug, tag.name) }}
          </button>
        </div>
      </div>

      <label class="admin-page__featured-row">
        <input v-model="form.featured" type="checkbox" class="h-4 w-4 rounded accent-brand" />
        <span class="admin-page__featured-label">{{ t('admin.poemForm.featuredEdit') }}</span>
      </label>

      <div class="admin-page__form-actions">
        <button type="submit" :disabled="loading" class="admin-page__btn-brand">
          {{ loading ? t('admin.poemForm.saving') : t('admin.poemForm.save') }}
        </button>
        <NuxtLink to="/admin/poems" class="admin-page__btn-ghost">{{ t('admin.poemForm.cancel') }}</NuxtLink>
      </div>
    </form>
  </div>
</template>


