<script setup lang="ts">
import type { ApiRouteGroup } from '~/utils/docsApiRoutes'

defineProps<{
  groups: ApiRouteGroup[]
}>()

const methodModifier: Record<string, string> = {
  GET: 'docs-api-table__method--get',
  POST: 'docs-api-table__method--post',
  PUT: 'docs-api-table__method--put',
  PATCH: 'docs-api-table__method--patch',
  DELETE: 'docs-api-table__method--delete',
}

const authLabel: Record<string, string> = {
  public: 'Public',
  user: 'User',
  staff: 'Staff',
  admin: 'Admin',
}
</script>

<template>
  <div class="docs-api-table">
    <section
      v-for="group in groups"
      :id="group.id"
      :key="group.id"
    >
      <h2 class="docs-api-heading">{{ group.title }}</h2>
      <div class="docs-api-table__scroll">
        <table>
          <thead>
            <tr class="docs-api-table__head-row">
              <th class="docs-api-table__th-method">Method</th>
              <th>Path</th>
              <th class="docs-api-table__th-desc">Descriere</th>
              <th class="docs-api-table__th-auth">Auth</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="route in group.routes"
              :key="`${route.method}-${route.path}`"
            >
              <td>
                <span
                  class="docs-api-table__method"
                  :class="methodModifier[route.method]"
                >
                  {{ route.method }}
                </span>
              </td>
              <td>
                <code class="docs-api-table__path">{{ route.path }}</code>
                <p class="docs-api-table__summary-mobile">{{ route.summary }}</p>
              </td>
              <td class="docs-api-table__summary-desktop">{{ route.summary }}</td>
              <td>
                <span class="docs-api-table__auth">{{ authLabel[route.auth ?? 'public'] }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
