<script setup lang="ts">
import { docsNavIsActive, docsTabForPath, docsTabGroups } from '~/utils/docsNav'

defineProps<{
  /** Close mobile sheet after navigation */
  onNavigate?: () => void
}>()

const route = useRoute()
const activeSection = computed(() => docsTabForPath(route.path))
</script>

<template>
  <nav class="docs-sidebar-nav" aria-label="Documentație">
    <div
      v-for="group in docsTabGroups"
      :key="group.id"
      class="docs-nav-section"
    >
      <p
        class="docs-nav-section-label"
        :class="{ 'docs-nav-section-label--active': activeSection === group.id }"
      >
        {{ group.label }}
      </p>

      <ul class="docs-nav-submenu" :aria-label="group.label">
        <li v-for="item in group.items" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="docs-nav-link"
            :class="{ 'docs-nav-link--active': docsNavIsActive(route.path, item.to) }"
            @click="onNavigate?.()"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.docs-sidebar-nav {
  @apply space-y-5;
}

.docs-nav-section-label {
  @apply mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-content-soft;
}

.docs-nav-section-label--active {
  @apply text-brand;
}

.docs-nav-submenu {
  @apply space-y-0.5;
}

.docs-nav-link {
  @apply block rounded-ds-md border-l-2 border-transparent py-2 pl-4 pr-3 text-sm text-content-muted transition-colors hover:border-edge-subtle hover:bg-surface-subtle hover:text-content;
}

.docs-nav-link--active {
  @apply border-brand bg-brand-soft/30 font-medium text-content;
}
</style>
