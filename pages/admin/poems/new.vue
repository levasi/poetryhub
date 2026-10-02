<script setup lang="ts">
import { getFetchErrorDataCode, getFetchErrorMessage, getFetchErrorStatus } from '~/utils/fetchApiError'

definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
const { labelForTag } = useTagLabel()
useSeoMeta({ title: computed(() => t('seo.adminNewPoem')) })

const router  = useRouter()
const loading = ref(false)
const error   = ref('')

const { data: authors } = await useFetch('/api/authors', { params: { limit: 200 } })
const { data: tags }    = await useFetch('/api/tags')

const form = reactive({
  title:     '',
  content:   '',
  authorId:  '',
  language:  'en',
  source:    'classic',
  sourceUrl: '',
  featured:  false,
  tagIds:    [] as string[],
})

function toggleTag(id: string) {
  const i = form.tagIds.indexOf(id)
  if (i === -1) form.tagIds.push(id)
  else           form.tagIds.splice(i, 1)
}

async function submit() {
  if (!form.title || !form.content || !form.authorId) {
    error.value = t('admin.poemForm.requiredFields')
    return
  }
  loading.value = true
  error.value   = ''
  try {
    const poem = await $fetch('/api/poems', { method: 'POST', body: form })
    router.push(`/admin/poems/${(poem as { slug: string }).slug}`)
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err)
    const code = getFetchErrorDataCode(err)
    if (status === 409 || code === 'DUPLICATE_POEM_TITLE') {
      error.value = t('authors.duplicatePoemTitle')
    } else {
      error.value = getFetchErrorMessage(err) ?? t('admin.poemForm.createFailed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__header admin-page__header--form">
      <NuxtLink to="/admin/poems" class="admin-page__back">{{ t('admin.poemForm.backPoems') }}</NuxtLink>
      <h1 class="admin-page__title">{{ t('admin.poemForm.newTitle') }}</h1>
    </div>

    <form class="admin-page__form" @submit.prevent="submit">
      <!-- Error -->
      <div v-if="error" class="admin-page__error">
        {{ error }}
      </div>

      <!-- Title -->
      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.titleRequired') }}</label>
        <input v-model="form.title" type="text" required class="admin-input" :placeholder="t('admin.poemForm.placeholderTitle')" />
      </div>

      <!-- Author -->
      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.authorRequired') }}</label>
        <select v-model="form.authorId" required class="admin-input">
          <option value="">{{ t('admin.poemForm.selectAuthor') }}</option>
          <option v-for="a in (authors as { data: { id: string; name: string }[] })?.data" :key="a.id" :value="a.id">
            {{ a.name }}
          </option>
        </select>
      </div>

      <!-- Content -->
      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.contentRequired') }}</label>
        <textarea
          v-model="form.content"
          rows="14"
          required
          class="admin-input admin-input--mono"
          :placeholder="t('admin.poemForm.placeholderContent')"
        />
        <p class="admin-page__hint-inline">{{ t('admin.poemForm.contentHint') }}</p>
      </div>

      <!-- Row: Language + Source -->
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

      <!-- Source URL -->
      <div>
        <label class="admin-page__field-label">{{ t('admin.poemForm.sourceUrl') }} <span class="admin-page__optional">{{ t('admin.poemForm.optional') }}</span></label>
        <input v-model="form.sourceUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <!-- Tags -->
      <div v-if="(tags as unknown[])?.length">
        <label class="admin-page__field-label">{{ t('admin.poemForm.tags') }}</label>
        <div class="admin-page__tag-row">
          <button
            v-for="tag in (tags as { id: string; name: string; color: string | null }[])"
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

      <!-- Featured -->
      <label class="admin-page__featured-row">
        <input v-model="form.featured" type="checkbox" class="admin-page__checkbox" />
        <span class="admin-page__featured-label">{{ t('admin.poemForm.featuredNew') }}</span>
      </label>

      <!-- Submit -->
      <div class="admin-page__form-actions">
        <button
          type="submit"
          :disabled="loading"
          class="admin-page__btn-brand"
        >
          {{ loading ? t('admin.poemForm.saving') : t('admin.poemForm.create') }}
        </button>
        <NuxtLink to="/admin/poems" class="admin-page__btn-ghost">
          {{ t('admin.poemForm.cancel') }}
        </NuxtLink>
      </div>
    </form>
  </div>
</template>


