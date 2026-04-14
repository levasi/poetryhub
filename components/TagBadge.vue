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
    :to="useRouterLink ? `/?tag=${slug}` : undefined"
    class="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium tracking-wide transition-colors"
    :class="[
      clickable || useRouterLink
        ? 'cursor-pointer hover:opacity-90'
        : 'cursor-default',
      active
        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400/60'
        : 'border border-edge-subtle bg-surface-raised text-content-secondary shadow-ds-card',
    ]"
    :style="color && !active ? `background-color:${color}22;color:${color};border-color:${color}55` : ''"
    @click="$emit('click')"
  >
    {{ displayName }}
  </component>
</template>
