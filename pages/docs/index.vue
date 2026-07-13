<script setup lang="ts">
definePageMeta({ layout: 'docs' })

useHead({
  title: 'Documentație — PoetryHub',
})
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Start</span>
    <h1>Documentație PoetryHub</h1>
    <p class="lead">
      Ghid tehnic pentru stack-ul aplicației, rutele API, funcționalitățile produsului și instrumentele de dezvoltare.
      Folosește meniul vertical din sidebar — fiecare secțiune are submeniuri expandabile.
    </p>

    <h2>Arhitectură</h2>
    <p>
      PoetryHub este o aplicație full-stack construită cu <strong>Nuxt 3</strong> (Vue 3 + Nitro).
      Frontend-ul și backend-ul trăiesc în același repo: paginile sunt în <code>pages/</code>, iar API-ul serverless
      în <code>server/api/</code>. Datele persistente sunt în <strong>PostgreSQL</strong> prin <strong>Prisma</strong>.
      Deploy-ul țintă este <strong>Vercel</strong> (preset Nitro <code>vercel</code>).
    </p>

    <pre><code>Browser (Vue 3 + Pinia)
    ↓ useFetch / $fetch
Nitro API (server/api/**)
    ↓ Prisma Client
PostgreSQL (Neon / orice provider PG)</code></pre>

    <h2>Organizare documentație</h2>
    <div class="docs-card-grid">
      <NuxtLink to="/docs/stack/frontend" class="docs-card">
        <h3>Stack → Frontend</h3>
        <p>Nuxt, Vue, Tailwind, Pinia, i18n, componente DS</p>
      </NuxtLink>
      <NuxtLink to="/docs/stack/backend" class="docs-card">
        <h3>Stack → Backend</h3>
        <p>Nitro handlers, JWT, OAuth Google, validare Zod</p>
      </NuxtLink>
      <NuxtLink to="/docs/stack/database" class="docs-card">
        <h3>Stack → Bază de date</h3>
        <p>Modele Prisma, relații, lexicon Write</p>
      </NuxtLink>
      <NuxtLink to="/docs/stack/deployment" class="docs-card">
        <h3>Stack → Deployment</h3>
        <p>Vercel, env vars, CI GitHub Actions</p>
      </NuxtLink>
      <NuxtLink to="/docs/api" class="docs-card">
        <h3>API</h3>
        <p>Referință completă endpoint-uri REST</p>
      </NuxtLink>
      <NuxtLink to="/docs/features/reading" class="docs-card">
        <h3>Features</h3>
        <p>Citire, Write, carousel, cont, admin</p>
      </NuxtLink>
      <NuxtLink to="/docs/development/storybook" class="docs-card">
        <h3>Dev → Storybook</h3>
        <p>Componente izolate, CSF3, port 6006</p>
      </NuxtLink>
      <NuxtLink to="/docs/development/testing" class="docs-card">
        <h3>Dev → Testare</h3>
        <p>Vitest, Playwright, structura tests/</p>
      </NuxtLink>
    </div>

    <h2>Structură repo</h2>
    <ul>
      <li><code>pages/</code> — rute file-based (public, account, admin, docs)</li>
      <li><code>components/</code> — UI reutilizabil + design system (<code>components/ds/</code>)</li>
      <li><code>composables/</code> — logică client partajată (auth, reader prefs, carousel)</li>
      <li><code>server/api/</code> — endpoint-uri Nitro</li>
      <li><code>server/utils/</code> — utilitare server (auth, cache, payload home)</li>
      <li><code>prisma/</code> — schema și migrări</li>
      <li><code>tests/</code> — unit, API, component, e2e</li>
      <li><code>.storybook/</code> — config Storybook 9</li>
    </ul>

    <h2>Comenzi utile</h2>
    <pre><code>npm run dev          # Nuxt dev server (port 3000)
npm run storybook    # Storybook (port 6006)
npm test             # Vitest (unit + API + component)
npm run test:e2e     # Playwright (build + smoke)
npm run db:studio    # Prisma Studio</code></pre>
  </DocsProse>
</template>
