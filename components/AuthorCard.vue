<script setup lang="ts">
import { displayNationality } from '~/utils/nationality'

interface Author {
  id: string
  name: string
  slug: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  deathYear: number | null
  imageUrl: string | null
  _count?: { poems: number }
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

const nationalityLabel = computed(() => displayNationality(props.author.nationality))
</script>

<template>
  <NuxtLink
    :to="`/authors/${author.slug}`"
    class="author-card"
  >
    <div class="author-card__avatar-wrap">
      <img
        :src="avatarSrc"
        :alt="author.name"
        loading="lazy"
        class="author-card__avatar"
      >
    </div>

    <div class="author-card__body">
      <h3 class="author-card__name">
        {{ author.name }}
      </h3>

      <div class="author-card__meta">
        <span v-if="nationalityLabel">{{ nationalityLabel }}</span>
        <span v-if="nationalityLabel && yearsLabel(author.birthYear, author.deathYear)">·</span>
        <span>{{ yearsLabel(author.birthYear, author.deathYear) }}</span>
      </div>

      <p
        v-if="author.bio"
        class="author-card__bio"
      >
        {{ author.bio }}
      </p>

      <p
        v-if="poemCountLabel"
        class="author-card__count"
      >
        {{ poemCountLabel }}
      </p>
    </div>
  </NuxtLink>
</template>
