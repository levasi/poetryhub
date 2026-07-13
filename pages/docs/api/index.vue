<script setup lang="ts">
import { apiRouteGroups } from '~/utils/docsApiRoutes'

definePageMeta({ layout: 'docs' })
useHead({ title: 'API — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">API</span>
    <h1>Rute API</h1>
    <p class="lead">
      Toate endpoint-urile Nitro sunt file-based în <code>server/api/</code>. Convenția de nume determină metoda HTTP
      și parametrul din path (<code>[slug]</code>, <code>[id]</code>).
    </p>

    <h2>Convenții</h2>
    <ul>
      <li><code>*.get.ts</code> → GET, <code>*.post.ts</code> → POST, <code>*.put.ts</code> → PUT, etc.</li>
      <li>Parametri dinamici: foldere <code>[slug]</code>, <code>[id]</code></li>
      <li>Răspunsuri JSON; erori via <code>createError({ statusCode, message })</code></li>
      <li>Auth: cookie JWT — niveluri public / user / staff / admin</li>
    </ul>

    <DocsApiTable :groups="apiRouteGroups" />
  </DocsProse>
</template>
