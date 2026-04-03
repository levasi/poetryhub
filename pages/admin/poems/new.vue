<script setup lang="ts">
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
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? t('admin.poemForm.createFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/admin/poems" class="text-sm text-ink-600 hover:text-ink-900">{{ t('admin.poemForm.backPoems') }}</NuxtLink>
      <h1 class="font-serif text-2xl font-bold text-ink-900">{{ t('admin.poemForm.newTitle') }}</h1>
    </div>

    <form class="space-y-5" @submit.prevent="submit">
      <!-- Error -->
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Title -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.titleRequired') }}</label>
        <input v-model="form.title" type="text" required class="admin-input" :placeholder="t('admin.poemForm.placeholderTitle')" />
      </div>

      <!-- Author -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.authorRequired') }}</label>
        <select v-model="form.authorId" required class="admin-input">
          <option value="">{{ t('admin.poemForm.selectAuthor') }}</option>
          <option v-for="a in (authors as { data: { id: string; name: string }[] })?.data" :key="a.id" :value="a.id">
            {{ a.name }}
          </option>
        </select>
      </div>

      <!-- Content -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.contentRequired') }}</label>
        <textarea
          v-model="form.content"
          rows="14"
          required
          class="admin-input font-mono text-xs"
          :placeholder="t('admin.poemForm.placeholderContent')"
        />
        <p class="mt-1 text-xs text-ink-600">{{ t('admin.poemForm.contentHint') }}</p>
      </div>

      <!-- Row: Language + Source -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.language') }}</label>
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
          <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.source') }}</label>
          <select v-model="form.source" class="admin-input">
            <option value="classic">{{ t('admin.poemForm.sources.classic') }}</option>
            <option value="user-submitted">{{ t('admin.poemForm.sources.user') }}</option>
            <option value="imported">{{ t('admin.poemForm.sources.imported') }}</option>
          </select>
        </div>
      </div>

      <!-- Source URL -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.sourceUrl') }} <span class="text-ink-700">{{ t('admin.poemForm.optional') }}</span></label>
        <input v-model="form.sourceUrl" type="url" class="admin-input" placeholder="https://…" />
      </div>

      <!-- Tags -->
      <div v-if="(tags as unknown[])?.length">
        <label class="mb-2 block text-xs font-medium text-ink-600">{{ t('admin.poemForm.tags') }}</label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tag in (tags as { id: string; name: string; color: string | null }[])"
            :key="tag.id"
            type="button"
            class="rounded-full border px-3 py-0.5 text-xs transition-colors"
            :class="form.tagIds.includes(tag.id)
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'"
            @click="toggleTag(tag.id)"
          >
            {{ labelForTag(tag.slug, tag.name) }}
          </button>
        </div>
      </div>

      <!-- Featured -->
      <label class="flex cursor-pointer items-center gap-3">
        <input v-model="form.featured" type="checkbox" class="h-4 w-4 rounded border-ink-300 accent-gold-600" />
        <span class="text-sm text-ink-700">{{ t('admin.poemForm.featuredNew') }}</span>
      </label>

      <!-- Submit -->
      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50"
        >
          {{ loading ? t('admin.poemForm.saving') : t('admin.poemForm.create') }}
        </button>
        <NuxtLink to="/admin/poems" class="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-600 hover:border-ink-300 hover:text-ink-900">
          {{ t('admin.poemForm.cancel') }}
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.admin-input {
  @apply w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40;
}
</style>
