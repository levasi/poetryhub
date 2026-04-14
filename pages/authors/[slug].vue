<script setup lang="ts">
import { $fetch as rawFetch } from 'ofetch'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

const { t } = useI18n()
const { user } = useAuth()

const route = useRoute()
const slug  = route.params.slug as string
const page  = ref(1)

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
const works  = computed(() => data.value?.works ?? [])
const poems  = computed(() => data.value?.poems.data ?? [])
const meta   = computed(() => data.value?.poems.meta)

const config = useRuntimeConfig()
const ogImage = computed(() => author.value?.imageUrl || `${config.public.appUrl}/favicon.svg`)

useSeoMeta({
  title:        computed(() => t('seo.authorTitle', { name: author.value?.name ?? '' })),
  description:  computed(() => author.value?.bio ?? t('seo.authorDesc', { name: author.value?.name ?? '' })),
  ogImage,
  twitterCard:  'summary_large_image',
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
</script>

<template>
  <div v-if="author" class="animate-fade-in">
    <!-- Back -->
    <NuxtLink to="/" class="mb-8 inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content">
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {{ t('home.navHome') }}
    </NuxtLink>

    <!-- Author profile -->
    <div class="mb-12 flex flex-col items-start gap-6 sm:flex-row">
      <!-- Avatar -->
      <div class="shrink-0">
        <img
          :src="avatarSrc"
          :alt="author.name"
          loading="eager"
          class="h-24 w-24 rounded-full object-cover ring-2 ring-gold-300/60"
        />
      </div>

      <!-- Info -->
      <div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="font-serif text-4xl font-bold text-content">{{ author.name }}</h1>
          <button
            v-if="isSiteOwner"
            type="button"
            class="shrink-0 rounded-md border border-danger/40 px-2 py-0.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
            :disabled="deletingAuthor"
            @click="deleteAuthor"
          >
            {{ deletingAuthor ? t('admin.poems.deleting') : t('admin.authors.delete') }}
          </button>
        </div>
        <p class="mt-1 text-sm text-content-secondary">
          <span v-if="author.nationality">{{ author.nationality }}</span>
          <span v-if="author.nationality && yearsLabel()"> · </span>
          <span>{{ yearsLabel() }}</span>
        </p>
        <p class="mt-3 text-sm text-content-muted">
          {{ t('authors.poemCount', meta?.total ?? 0) }}
        </p>
      </div>
    </div>

    <!-- Biography -->
    <section class="mb-10 border-t border-edge/80 pt-8">
      <h2 class="mb-3 font-serif text-xl font-bold text-content">{{ t('authors.biography') }}</h2>
      <p
        v-if="author.bio"
        class="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-content-secondary"
      >
        {{ author.bio }}
      </p>
      <p v-else class="max-w-3xl text-sm italic text-content-muted">{{ t('authors.bioUnavailable') }}</p>
    </section>

    <!-- Bibliography (works in this collection) -->
    <section v-if="works.length" class="mb-10 border-t border-edge/80 pt-8">
      <h2 class="mb-1 font-serif text-xl font-bold text-content">{{ t('authors.bibliography') }}</h2>
      <p class="mb-4 text-sm text-content-muted">{{ t('authors.worksInCollection') }}</p>
      <ul
        class="max-h-80 max-w-3xl list-inside list-disc space-y-1.5 overflow-y-auto text-sm text-content-secondary sm:columns-2 sm:gap-x-8"
      >
        <li v-for="w in works" :key="w.slug" class="break-inside-avoid">
          <span class="inline-flex flex-wrap items-baseline gap-1.5">
            <NuxtLink
              :to="`/poems/${w.slug}`"
              class="font-medium text-brand underline-offset-2 hover:text-brand-hover hover:underline"
            >
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
      <PaginationNav
        :page="page"
        :total-pages="meta!.totalPages"
        @update:page="(p) => { page = p }"
      />
    </div>
  </div>
</template>
