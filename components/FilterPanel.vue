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
  { value: 'ai-generated', label: t('filters.ai') },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Mood -->
    <div v-if="moodTags?.length">
      <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">{{ t('filters.mood') }}</p>
      <div class="flex flex-wrap gap-1.5">
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

    <!-- Theme -->
    <div v-if="themeTags?.length">
      <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">{{ t('filters.theme') }}</p>
      <div class="flex flex-wrap gap-1.5">
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

    <!-- Source -->
    <div>
      <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">{{ t('filters.source') }}</p>
      <div class="flex flex-wrap gap-1.5">
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

    <!-- Clear -->
    <button
      v-if="hasActiveFilters"
      class="w-full rounded-lg border border-ink-200 bg-white py-2 text-xs text-ink-600 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900"
      @click="emit('clear')"
    >
      {{ t('filters.clearAllFilters') }}
    </button>
  </div>
</template>
