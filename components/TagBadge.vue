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
    :class="[
      clickable || useRouterLink
        ? 'cursor-pointer hover:opacity-90'
        : 'cursor-default',
      active
        ? 'gap-1 border-brand/40 bg-brand-tint text-content ring-1 ring-brand/30'
        : 'border border-edge-subtle bg-surface-subtle text-content-muted',
      'inline-flex items-center rounded-full px-2.5 py-1 text-ui-xs font-medium tracking-wide transition-colors',
    ]"
    :style="color && !active ? `background-color:${color}22;color:${color};border-color:${color}55` : ''"
    @click="$emit('click')"
  >
    <span
      v-if="active"
      class="text-brand"
      aria-hidden="true"
    >✦</span>
    {{ displayName }}
  </component>
</template>
