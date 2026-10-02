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
  <nav
    class="docs-sidebar-nav"
    aria-label="Documentație"
  >
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

      <ul
        class="docs-nav-submenu"
        :aria-label="group.label"
      >
        <li
          v-for="item in group.items"
          :key="item.to"
        >
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
