<script setup lang="ts">
const { t } = useI18n()

const route = useRoute()
const slug  = route.params.slug as string
const page  = ref(1)

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

useSeoMeta({
  title:       computed(() => t('seo.authorTitle', { name: author.value?.name ?? '' })),
  description: computed(() => author.value?.bio ?? t('seo.authorDesc', { name: author.value?.name ?? '' })),
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
    <NuxtLink to="/authors" class="mb-8 inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content">
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {{ t('nav.allAuthors') }}
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
        <h1 class="font-serif text-4xl font-bold text-content">{{ author.name }}</h1>
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
      <PoetryCard v-for="poem in poems" :key="poem.id" :poem="poem" />
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
