<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Deployment — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Stack</span>
    <h1>Deployment</h1>
    <p class="lead">
      PoetryHub este configurat pentru deploy pe <strong>Vercel</strong> cu funcții serverless Nitro și PostgreSQL extern.
    </p>

    <h2>Vercel</h2>
    <ul>
      <li>Preset Nitro: <code>vercel</code> în <code>nuxt.config.ts</code></li>
      <li>Build: <code>prisma generate && nuxt build</code></li>
      <li>Node engines: <code>^20.19.0 || >=22.12.0</code></li>
      <li>CLI helpers: <code>npm run vercel:link</code>, <code>npm run env:pull:prod</code></li>
    </ul>

    <h2>Variabile de mediu</h2>
    <table>
      <thead>
        <tr>
          <th>Variabilă</th>
          <th>Scop</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>DATABASE_URL</code></td><td>Conexiune PostgreSQL</td></tr>
        <tr><td><code>JWT_SECRET</code></td><td>Semnare token sesiune</td></tr>
        <tr><td><code>NUXT_PUBLIC_APP_URL</code></td><td>URL public aplicație</td></tr>
        <tr><td><code>NUXT_OAUTH_GOOGLE_*</code></td><td>OAuth Google</td></tr>
        <tr><td><code>ANTHROPIC_API_KEY</code></td><td>Enrichment AI opțional</td></tr>
        <tr><td><code>ADMIN_EMAIL / ADMIN_PASSWORD</code></td><td>Seed admin inițial</td></tr>
      </tbody>
    </table>

    <h2>CI (GitHub Actions)</h2>
    <p>Workflow <code>.github/workflows/ci.yml</code>:</p>
    <ol>
      <li><code>npm test</code> — Vitest (unit, API, component)</li>
      <li><code>npm run test:e2e</code> — Playwright cu Postgres de test</li>
      <li>Verificare tokeni legacy CSS (<code>check:legacy-tokens</code>)</li>
    </ol>

    <h2>Cache & performanță</h2>
    <ul>
      <li>Assets <code>/_nuxt/**</code> — cache immutable 1 an</li>
      <li>API publice — <code>defineCachedEventHandler</code> cu invalidare pe tag</li>
      <li>Home payload agregat în <code>server/utils/homePagePayload.ts</code></li>
    </ul>

    <h2>Storybook (static)</h2>
    <pre><code>npm run build-storybook   # Output: storybook-static/</code></pre>
    <p>Poate fi hostat separat sau ca preview static; nu face parte din deploy-ul principal Nuxt.</p>
  </DocsProse>
</template>
