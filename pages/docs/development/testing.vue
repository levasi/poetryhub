<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Testare — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Dev</span>
    <h1>Testare</h1>
    <p class="lead">
      Suite de teste pe mai multe straturi: logică pură, API handlers, componente Vue și smoke E2E.
    </p>

    <h2>Stack</h2>
    <table>
      <thead>
        <tr>
          <th>Strat</th>
          <th>Tool</th>
          <th>Locație</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Unit</td><td>Vitest (node)</td><td><code>tests/unit/**</code></td></tr>
        <tr><td>API</td><td>Vitest + h3 mocks</td><td><code>tests/api/**</code></td></tr>
        <tr><td>Component</td><td>Vitest + @nuxt/test-utils</td><td><code>tests/components/**</code></td></tr>
        <tr><td>E2E</td><td>Playwright</td><td><code>tests/e2e/**</code></td></tr>
      </tbody>
    </table>

    <h2>Configurare</h2>
    <ul>
      <li><code>vitest.config.ts</code> — environment default <code>nuxt</code>; fișiere server folosesc <code>@vitest-environment node</code></li>
      <li><code>playwright.config.ts</code> — webServer cu <code>npm run build:e2e</code></li>
      <li>Fixtures: <code>tests/fixtures/</code> — <code>poem.ts</code>, <code>lexicon.ts</code></li>
      <li>Helpers: <code>tests/helpers/nitro.ts</code></li>
    </ul>

    <h2>Comenzi</h2>
    <pre><code>npm test                              # Toate testele Vitest
npm run test:watch                      # Watch mode
npx vitest run tests/api/home.get.test.ts  # Un fișier
npm run test:e2e                        # Playwright (build + browser)
npm run test:all                        # Vitest + E2E</code></pre>

    <h2>Pattern-uri</h2>
    <h3>Unit (logică pură)</h3>
    <pre><code>// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { myFn } from '~/utils/myFn'</code></pre>

    <h3>API handler</h3>
    <ul>
      <li><code>vi.mock</code> prisma / utils la granița modulului</li>
      <li><code>createEvent</code> din h3 cu query string</li>
      <li>Dynamic <code>import()</code> handler după mocks</li>
      <li>Exemplu: <code>tests/api/words.get.test.ts</code></li>
    </ul>

    <h3>Component</h3>
    <ul>
      <li><code>mountSuspended</code> din <code>@nuxt/test-utils/runtime</code></li>
      <li>Selectori <code>data-testid</code> când există</li>
      <li>Exemplu: <code>tests/components/PaginationNav.test.ts</code></li>
    </ul>

    <h3>E2E</h3>
    <ul>
      <li><code>tests/e2e/smoke.spec.ts</code> — încărcare pagini + API JSON</li>
      <li>Rulează pe build producție (<code>NITRO_PRESET=node-server</code>)</li>
    </ul>

    <h2>CI</h2>
    <p>GitHub Actions rulează <code>npm test</code> apoi <code>npm run test:e2e</code> cu Postgres și env de test.</p>

    <h2>Ce testăm</h2>
    <ul>
      <li>Auth, roluri, validare input</li>
      <li>Motor rime, diacritice românești, normalizare</li>
      <li>Contracte API publice (home, poems, tags, carousel)</li>
      <li>Componente DS și carduri poem</li>
    </ul>
  </DocsProse>
</template>
