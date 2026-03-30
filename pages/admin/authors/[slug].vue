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
  <div class="w-full">
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/admin/authors" class="text-sm text-ink-600 hover:text-ink-900">{{ t('admin.authors.backList') }}</NuxtLink>
      <h1 class="truncate font-serif text-xl font-bold text-ink-900">{{ t('admin.authors.editTitle', { name: form.name }) }}</h1>
    </div>

    <form class="space-y-5" @submit.prevent="submit">
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.name') }}</label>
        <input v-model="form.name" type="text" required class="admin-input" />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.bio') }}</label>
        <textarea v-model="form.bio" rows="4" class="admin-input" />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.nationality') }}</label>
        <input v-model="form.nationality" type="text" class="admin-input" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.birthYear') }}</label>
          <input v-model.number="form.birthYear" type="number" class="admin-input" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.deathYear') }}</label>
          <input v-model.number="form.deathYear" type="number" class="admin-input" />
        </div>
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.authors.photoUrl') }}</label>
        <input v-model="form.imageUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="loading" class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50">
          {{ loading ? t('admin.authors.saving') : t('admin.authors.save') }}
        </button>
        <NuxtLink to="/admin/authors" class="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-600 hover:border-ink-300 hover:text-ink-900">{{ t('admin.authors.cancel') }}</NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.admin-input { @apply w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40; }
</style>
