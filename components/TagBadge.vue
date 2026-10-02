<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name:     string
    slug?:    string
    /** When false, do not render NuxtLink (e.g. filter panel uses @click). Still translates via slug. */
    link?:    boolean
    color?:   string | null
    active?:  boolean
    clickable?: boolean
  }>(),
  { link: undefined },
)

defineEmits<{ click: [] }>()

const { labelForTag } = useTagLabel()

const displayName = computed(() =>
  props.slug ? labelForTag(props.slug, props.name) : props.name,
)

const useRouterLink = computed(() => {
  if (!props.slug) return false
  if (props.link === false) return false
  return true
})
</script>

<template>
  <component
    :is="useRouterLink ? 'NuxtLink' : 'span'"
    :to="useRouterLink ? `/descopera?tag=${slug}` : undefined"
    class="tag-badge"
    :class="[
      clickable || useRouterLink ? 'tag-badge--interactive' : 'tag-badge--static',
      { 'tag-badge--active': active },
    ]"
    :style="color && !active ? `background-color:${color}22;color:${color};border-color:${color}55` : ''"
    @click="$emit('click')"
  >
    <span
      v-if="active"
      class="tag-badge__mark"
      aria-hidden="true"
    >✦</span>
    {{ displayName }}
  </component>
</template>
