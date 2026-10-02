<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  moodTags:  any[] | null
  themeTags: any[] | null
  filters:   Record<string, any>
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  apply: [filters: Record<string, any>]
  clear: []
}>()

const sources = computed(() => [
  { value: 'classic', label: t('filters.classic') },
  { value: 'imported', label: t('filters.imported') },
])
</script>

<template>
  <div class="filter-panel">
    <div v-if="moodTags?.length">
      <p class="filter-panel__section-title">{{ t('filters.mood') }}</p>
      <div class="filter-panel__tags">
        <TagBadge
          v-for="tag in moodTags"
          :key="tag.id"
          :name="tag.name"
          :slug="tag.slug"
          :link="false"
          :color="tag.color"
          :active="filters.tag === tag.slug"
          clickable
          @click="emit('apply', { tag: filters.tag === tag.slug ? undefined : tag.slug })"
        />
      </div>
    </div>

    <div v-if="themeTags?.length">
      <p class="filter-panel__section-title">{{ t('filters.theme') }}</p>
      <div class="filter-panel__tags">
        <TagBadge
          v-for="tag in themeTags"
          :key="tag.id"
          :name="tag.name"
          :slug="tag.slug"
          :link="false"
          :color="tag.color"
          :active="filters.tag === tag.slug"
          clickable
          @click="emit('apply', { tag: filters.tag === tag.slug ? undefined : tag.slug })"
        />
      </div>
    </div>

    <div>
      <p class="filter-panel__section-title">{{ t('filters.source') }}</p>
      <div class="filter-panel__tags">
        <TagBadge
          v-for="src in sources"
          :key="src.value"
          :name="src.label"
          :active="filters.source === src.value"
          clickable
          @click="emit('apply', { source: filters.source === src.value ? undefined : src.value })"
        />
      </div>
    </div>

    <button
      v-if="hasActiveFilters"
      class="filter-panel__clear"
      @click="emit('clear')"
    >
      {{ t('filters.clearAllFilters') }}
    </button>
  </div>
</template>
