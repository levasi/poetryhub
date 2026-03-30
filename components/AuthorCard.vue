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
    class="group flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-all hover:border-gold-300 hover:shadow-md"
  >
    <!-- Avatar -->
    <div class="shrink-0">
      <img
        :src="avatarSrc"
        :alt="author.name"
        loading="lazy"
        class="h-14 w-14 rounded-full object-cover ring-2 ring-ink-100 group-hover:ring-gold-300/60"
      />
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <h3 class="font-serif text-base font-bold text-ink-900 group-hover:text-gold-800 transition-colors truncate">
        {{ author.name }}
      </h3>

      <div class="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
        <span v-if="author.nationality">{{ author.nationality }}</span>
        <span v-if="author.nationality && yearsLabel(author.birthYear, author.deathYear)">·</span>
        <span>{{ yearsLabel(author.birthYear, author.deathYear) }}</span>
      </div>

      <p v-if="author.bio" class="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-600">
        {{ author.bio }}
      </p>

      <p v-if="poemCountLabel" class="mt-2 text-xs text-ink-500">
        {{ poemCountLabel }}
      </p>
    </div>
  </NuxtLink>
</template>
