<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminNewAuthor')) })

const router  = useRouter()
const loading = ref(false)
const error   = ref('')

const form = reactive({
  name:        '',
  bio:         '',
  nationality: '',
  birthYear:   null as number | null,
  deathYear:   null as number | null,
  imageUrl:    '',
})

async function submit() {
  if (!form.name) { error.value = t('admin.authors.nameRequiredError'); return }
  loading.value = true
  error.value   = ''
  try {
    const author = await $fetch('/api/authors', {
      method: 'POST',
      body: {
        ...form,
        birthYear: form.birthYear || undefined,
        deathYear: form.deathYear || undefined,
        imageUrl:  form.imageUrl  || undefined,
      },
    })
    router.push(`/admin/authors/${(author as { slug: string }).slug}`)
  } catch (err: unknown) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? t('admin.authors.createFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
<div class="admin-page">
    <div class="admin-page__header admin-page__header--form">
      <NuxtLink to="/admin/authors" class="admin-page__back">{{ t('admin.authors.backList') }}</NuxtLink>
      <h1 class="admin-page__title">{{ t('admin.authors.newTitle') }}</h1>
    </div>

    <form class="admin-page__form" @submit.prevent="submit">
      <div v-if="error" class="admin-page__error">{{ error }}</div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.nameRequired') }}</label>
        <input v-model="form.name" type="text" required class="admin-input" :placeholder="t('admin.authors.placeholderName')" />
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.bio') }}</label>
        <textarea v-model="form.bio" rows="4" class="admin-input" :placeholder="t('admin.authors.placeholderBio')" />
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.nationality') }}</label>
        <input v-model="form.nationality" type="text" class="admin-input" :placeholder="t('admin.authors.placeholderNationality')" />
      </div>

      <div class="admin-page__year-grid">
        <div>
          <label class="admin-page__field-label">{{ t('admin.authors.birthYear') }}</label>
          <input v-model.number="form.birthYear" type="number" min="500" max="2024" class="admin-input" placeholder="1874" />
        </div>
        <div>
          <label class="admin-page__field-label">{{ t('admin.authors.deathYear') }}</label>
          <input v-model.number="form.deathYear" type="number" min="500" max="2024" class="admin-input" placeholder="1963" />
        </div>
      </div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.photoUrl') }} <span class="admin-page__optional">{{ t('admin.poemForm.optional') }}</span></label>
        <input v-model="form.imageUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <div class="admin-page__form-actions">
        <button type="submit" :disabled="loading" class="admin-page__btn-brand">
          {{ loading ? t('admin.authors.saving') : t('admin.authors.create') }}
        </button>
        <NuxtLink to="/admin/authors" class="admin-page__btn-ghost">{{ t('admin.authors.cancel') }}</NuxtLink>
      </div>
    </form>
  </div>
</template>


