<script setup lang="ts">
import { $fetch as rawFetch } from 'ofetch'
import { displayNationality } from '~/utils/nationality'
import { SITE_OWNER_EMAIL } from '~/utils/roles'
import { isStaffRole } from '~/utils/roles'

definePageMeta({
  layout: 'fullwidth',
})

const { t } = useI18n()
const { user } = useAuth()

const route = useRoute()
const slug = route.params.slug as string
const page = ref(1)

const isSiteOwner = computed(
  () => user.value?.email?.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase(),
)

const deletingAuthor = ref(false)

async function deleteAuthor() {
  if (deletingAuthor.value) return
  if (!confirm(t('admin.authors.confirmDelete'))) return
  deletingAuthor.value = true
  try {
    await rawFetch(`/api/authors/${encodeURIComponent(slug)}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('admin.authors.updateFailed'))
  } finally {
    deletingAuthor.value = false
  }
}

const { data, error, refresh } = await useFetch(`/api/authors/${slug}`, {
  params: computed(() => ({ page: page.value, limit: 10 })),
  watch: [page],
})

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: t('authors.notFound') })
}

const author = computed(() => data.value?.author)
const works = computed(() => data.value?.works ?? [])
const poems = computed(() => data.value?.poems.data ?? [])
const meta = computed(() => data.value?.poems.meta)

const config = useRuntimeConfig()
const ogImage = computed(() => author.value?.imageUrl || `${config.public.appUrl}/favicon.svg`)

useSeoMeta({
  title: computed(() => t('seo.authorTitle', { name: author.value?.name ?? '' })),
  description: computed(() => author.value?.bio ?? t('seo.authorDesc', { name: author.value?.name ?? '' })),
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
})

function yearsLabel() {
  const a = author.value
  if (!a) return ''
  if (a.birthYear && a.deathYear) return t('authors.lifeSpan', { birth: a.birthYear, death: a.deathYear })
  if (a.birthYear) return t('authors.born', { year: a.birthYear })
  return ''
}

const avatarSrc = computed(() =>
  author.value ? authorAvatarUrl(author.value) : '',
)

const canEditEthnicity = computed(() => isStaffRole(user.value?.role))
const editingEthnicity = ref(false)
const ethnicityDraft = ref('')
const savingEthnicity = ref(false)

const nationalityLabel = computed(() => displayNationality(author.value?.nationality))

watch(
  author,
  (a) => {
    if (!a) return
    ethnicityDraft.value = a.nationality ?? ''
  },
  { immediate: true },
)

function startEditEthnicity() {
  if (!author.value) return
  editingEthnicity.value = true
  ethnicityDraft.value = author.value.nationality ?? ''
}

function cancelEditEthnicity() {
  editingEthnicity.value = false
  ethnicityDraft.value = author.value?.nationality ?? ''
}

async function saveEthnicity() {
  if (!author.value || savingEthnicity.value) return
  savingEthnicity.value = true
  try {
    const updated = await rawFetch(`/api/authors/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: { nationality: ethnicityDraft.value.trim() },
    })
    if (data.value?.author) data.value.author = updated
    editingEthnicity.value = false
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('admin.authors.updateFailed'))
  } finally {
    savingEthnicity.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <div v-if="author" class="w-full min-w-0 px-4 pb-20 pt-2 md:px-8 md:pt-4 lg:px-10 xl:px-12">
      <!-- Author profile -->
      <div class="mb-12 flex flex-col items-start gap-6 sm:flex-row">
        <!-- Avatar -->
        <div class="shrink-0">
          <img :src="avatarSrc" :alt="author.name" loading="eager"
            class="h-24 w-24 rounded-full object-cover ring-2 ring-gold-300/60" />
        </div>

        <!-- Info -->
        <div>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 class="font-serif text-4xl font-bold text-content">{{ author.name }}</h1>
            <button v-if="isSiteOwner" type="button"
              class="shrink-0 rounded-md border border-danger/40 px-2 py-0.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
              :disabled="deletingAuthor" @click="deleteAuthor">
              {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
            </button>
          </div>
          <p class="mt-1 text-sm text-content-secondary">
            <template v-if="!editingEthnicity">
              <span v-if="nationalityLabel">{{ nationalityLabel }}</span>
              <span v-if="nationalityLabel && yearsLabel()"> · </span>
              <span>{{ yearsLabel() }}</span>
              <button v-if="canEditEthnicity" type="button"
                class="ml-2 inline-flex items-center gap-1 rounded-lg border border-edge-subtle bg-surface-subtle px-2 py-1 text-xs font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised"
                @click="startEditEthnicity">
                {{ t('admin.authors.edit') }}
              </button>
            </template>
            <template v-else>
              <span class="sr-only">{{ t('admin.authors.nationality') }}</span>
              <input v-model="ethnicityDraft" type="text"
                class="mr-2 inline-flex w-[min(24rem,80vw)] rounded-lg border border-edge-subtle bg-surface-page px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                :placeholder="t('admin.authors.placeholderNationality')" />
              <button type="button"
                class="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
                :disabled="savingEthnicity" @click="saveEthnicity">
                {{ savingEthnicity ? t('admin.authors.saving') : t('admin.authors.save') }}
              </button>
              <button type="button"
                class="ml-2 inline-flex items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised disabled:opacity-50"
                :disabled="savingEthnicity" @click="cancelEditEthnicity">
                {{ t('admin.authors.cancel') }}
              </button>
              <span class="ml-2 text-sm text-content-secondary">{{ yearsLabel() }}</span>
            </template>
          </p>
          <p class="mt-3 text-sm text-content-muted">
            {{ t('authors.poemCount', meta?.total ?? 0) }}
          </p>
        </div>
      </div>

      <!-- Biography -->
      <section class="mb-10 border-t border-edge/80 pt-8">
        <h2 class="mb-3 font-serif text-xl font-bold text-content">{{ t('authors.biography') }}</h2>
        <p v-if="author.bio" class="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-content-secondary">
          {{ author.bio }}
        </p>
        <p v-else class="max-w-3xl text-sm italic text-content-muted">{{ t('authors.bioUnavailable') }}</p>
      </section>

      <!-- Bibliography (works in this collection) -->
      <section v-if="works.length" class="mb-10 border-t border-edge/80 pt-8">
        <h2 class="mb-1 font-serif text-xl font-bold text-content">{{ t('authors.bibliography') }}</h2>
        <p class="mb-4 text-sm text-content-muted">{{ t('authors.worksInCollection') }}</p>
        <ul
          class="max-h-80 max-w-3xl list-inside list-disc space-y-1.5 overflow-y-auto text-sm text-content-secondary sm:columns-2 sm:gap-x-8">
          <li v-for="w in works" :key="w.slug" class="break-inside-avoid">
            <span class="inline-flex flex-wrap items-baseline gap-1.5">
              <NuxtLink :to="`/poems/${w.slug}`"
                class="font-medium text-brand underline-offset-2 hover:text-brand-hover hover:underline">
                {{ w.title }}
              </NuxtLink>
              <PoemCarouselIcon :slug="w.slug" size="sm" />
            </span>
          </li>
        </ul>
      </section>

      <!-- Poems -->
      <div v-if="poems.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PoetryCard v-for="poem in poems" :key="poem.id" :poem="poem" :quick-read-list="poems" />
      </div>

      <div v-else class="py-12 text-center text-content-secondary">
        <p class="font-serif">{{ t('authors.noPoemsYet') }}</p>
      </div>

      <!-- Pagination -->
      <div v-if="(meta?.totalPages ?? 1) > 1" class="mt-10">
        <PaginationNav :page="page" :total-pages="meta!.totalPages" @update:page="(p) => { page = p }" />
      </div>
    </div>
  </div>
</template>
