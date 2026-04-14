<script setup lang="ts">
interface Author {
  id:          string
  name:        string
  slug:        string
  bio:         string | null
  nationality: string | null
  birthYear:   number | null
  deathYear:   number | null
  imageUrl:    string | null
  _count?:     { poems: number }
}

const props = defineProps<{ author: Author }>()

const { t } = useI18n()

function yearsLabel(birth?: number | null, death?: number | null) {
  if (!birth && !death) return null
  if (birth && death) return t('authors.lifeSpan', { birth, death })
  if (birth) return t('authors.born', { year: birth })
  return null
}

const poemCountLabel = computed(() => {
  const n = props.author._count?.poems
  if (n === undefined) return null
  return t('authors.poemCount', n)
})

const avatarSrc = computed(() => authorAvatarUrl(props.author))
</script>

<template>
  <NuxtLink
    :to="`/authors/${author.slug}`"
    class="group flex items-start gap-4 rounded-2xl border border-edge-subtle bg-surface-raised p-5 shadow-ds-card transition-all hover:border-brand/40 hover:shadow-ds-card-hover"
  >
    <!-- Avatar -->
    <div class="shrink-0">
      <img
        :src="avatarSrc"
        :alt="author.name"
        loading="lazy"
        class="h-14 w-14 rounded-full object-cover ring-2 ring-edge-subtle group-hover:ring-brand/40"
      />
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <h3 class="font-serif text-base font-bold text-content transition-colors group-hover:text-brand truncate">
        {{ author.name }}
      </h3>

      <div class="mt-0.5 flex items-center gap-2 text-xs text-content-muted">
        <span v-if="author.nationality">{{ author.nationality }}</span>
        <span v-if="author.nationality && yearsLabel(author.birthYear, author.deathYear)">·</span>
        <span>{{ yearsLabel(author.birthYear, author.deathYear) }}</span>
      </div>

      <p v-if="author.bio" class="mt-2 line-clamp-2 text-xs leading-relaxed text-content-secondary">
        {{ author.bio }}
      </p>

      <p v-if="poemCountLabel" class="mt-2 text-xs text-content-muted">
        {{ poemCountLabel }}
      </p>
    </div>
  </NuxtLink>
</template>
