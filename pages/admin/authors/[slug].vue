<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()

const route   = useRoute()
const router  = useRouter()
const slug    = route.params.slug as string
const loading = ref(false)
const error   = ref('')

const { data } = await useFetch(`/api/authors/${slug}`)
if (!data.value) throw createError({ statusCode: 404 })

const author = computed(() => (data.value as { author: { name: string; bio: string | null; nationality: string | null; birthYear: number | null; deathYear: number | null; imageUrl: string | null } })?.author)
useSeoMeta({ title: computed(() => t('seo.adminEditAuthor', { name: author.value?.name ?? '' })) })

const form = reactive({
  name:        author.value?.name        ?? '',
  bio:         author.value?.bio         ?? '',
  nationality: author.value?.nationality ?? '',
  birthYear:   author.value?.birthYear   ?? null as number | null,
  deathYear:   author.value?.deathYear   ?? null as number | null,
  imageUrl:    author.value?.imageUrl    ?? '',
})

async function submit() {
  loading.value = true
  error.value   = ''
  try {
    await $fetch(`/api/authors/${slug}`, {
      method: 'PUT',
      body: { ...form, birthYear: form.birthYear || null, deathYear: form.deathYear || null, imageUrl: form.imageUrl || null },
    })
    router.push('/admin/authors')
  } catch (err: unknown) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? t('admin.authors.updateFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
<div class="admin-page">
    <div class="admin-page__header admin-page__header--form">
      <NuxtLink to="/admin/authors" class="admin-page__back">{{ t('admin.authors.backList') }}</NuxtLink>
      <h1 class="admin-page__title admin-page__title--truncate">{{ t('admin.authors.editTitle', { name: form.name }) }}</h1>
    </div>

    <form class="admin-page__form" @submit.prevent="submit">
      <div v-if="error" class="admin-page__error">{{ error }}</div>

      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.name') }}</label>
        <input v-model="form.name" type="text" required class="admin-input" />
      </div>
      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.bio') }}</label>
        <textarea v-model="form.bio" rows="4" class="admin-input" />
      </div>
      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.nationality') }}</label>
        <input v-model="form.nationality" type="text" class="admin-input" />
      </div>
      <div class="admin-page__year-grid">
        <div>
          <label class="admin-page__field-label">{{ t('admin.authors.birthYear') }}</label>
          <input v-model.number="form.birthYear" type="number" class="admin-input" />
        </div>
        <div>
          <label class="admin-page__field-label">{{ t('admin.authors.deathYear') }}</label>
          <input v-model.number="form.deathYear" type="number" class="admin-input" />
        </div>
      </div>
      <div>
        <label class="admin-page__field-label">{{ t('admin.authors.photoUrl') }}</label>
        <input v-model="form.imageUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>
      <div class="admin-page__form-actions">
        <button type="submit" :disabled="loading" class="admin-page__btn-brand">
          {{ loading ? t('admin.authors.saving') : t('admin.authors.save') }}
        </button>
        <NuxtLink to="/admin/authors" class="admin-page__btn-ghost">{{ t('admin.authors.cancel') }}</NuxtLink>
      </div>
    </form>
  </div>
</template>


