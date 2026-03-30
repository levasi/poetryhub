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
  <div class="w-full">
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/admin/authors" class="text-sm text-ink-600 hover:text-ink-900">{{ t('admin.authors.backList') }}</NuxtLink>
      <h1 class="font-serif text-2xl font-bold text-ink-900">{{ t('admin.authors.newTitle') }}</h1>
    </div>

    <form class="space-y-5" @submit.prevent="submit">
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.nameRequired') }}</label>
        <input v-model="form.name" type="text" required class="admin-input" :placeholder="t('admin.authors.placeholderName')" />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.bio') }}</label>
        <textarea v-model="form.bio" rows="4" class="admin-input" :placeholder="t('admin.authors.placeholderBio')" />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.nationality') }}</label>
        <input v-model="form.nationality" type="text" class="admin-input" :placeholder="t('admin.authors.placeholderNationality')" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.birthYear') }}</label>
          <input v-model.number="form.birthYear" type="number" min="500" max="2024" class="admin-input" placeholder="1874" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.deathYear') }}</label>
          <input v-model.number="form.deathYear" type="number" min="500" max="2024" class="admin-input" placeholder="1963" />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.photoUrl') }} <span class="text-ink-700">{{ t('admin.poemForm.optional') }}</span></label>
        <input v-model="form.imageUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="loading" class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50">
          {{ loading ? t('admin.authors.saving') : t('admin.authors.create') }}
        </button>
        <NuxtLink to="/admin/authors" class="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-600 hover:border-ink-300 hover:text-ink-900">{{ t('admin.authors.cancel') }}</NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.admin-input { @apply w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40; }
</style>
