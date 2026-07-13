<script setup lang="ts">
import type { ApiRouteGroup } from '~/utils/docsApiRoutes'

defineProps<{
  groups: ApiRouteGroup[]
}>()

const methodClass: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  POST: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PATCH: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const authLabel: Record<string, string> = {
  public: 'Public',
  user: 'User',
  staff: 'Staff',
  admin: 'Admin',
}
</script>

<template>
  <div class="docs-api-table space-y-10">
    <section v-for="group in groups" :key="group.id" :id="group.id">
      <h2 class="docs-api-heading">{{ group.title }}</h2>
      <div class="overflow-x-auto rounded-ds-lg border border-edge-subtle">
        <table>
          <thead>
            <tr class="bg-surface-subtle/60">
              <th class="w-24">Method</th>
              <th>Path</th>
              <th class="hidden md:table-cell">Descriere</th>
              <th class="w-24">Auth</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in group.routes" :key="`${route.method}-${route.path}`">
              <td>
                <span
                  class="inline-flex rounded-ds-sm px-2 py-0.5 font-mono text-[11px] font-semibold"
                  :class="methodClass[route.method]"
                >
                  {{ route.method }}
                </span>
              </td>
              <td>
                <code class="text-xs">{{ route.path }}</code>
                <p class="mt-1 text-xs text-content-muted md:hidden">{{ route.summary }}</p>
              </td>
              <td class="hidden text-content-secondary md:table-cell">{{ route.summary }}</td>
              <td>
                <span class="text-xs text-content-soft">{{ authLabel[route.auth ?? 'public'] }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.docs-api-heading {
  @apply mb-4 mt-12 scroll-mt-24 font-serif text-xl font-semibold tracking-tight text-content first:mt-0;
}
</style>
