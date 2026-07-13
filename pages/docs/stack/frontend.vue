<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Frontend — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Stack</span>
    <h1>Frontend</h1>
    <p class="lead">
      Interfața PoetryHub este o SPA/SSR hibridă Nuxt 3, optimizată pentru citire literară și fluxuri editoriale calme.
    </p>

    <h2>Framework & runtime</h2>
    <ul>
      <li><strong>Nuxt 3</strong> (<code>^3.14</code>) — routing, SSR, auto-imports, Nitro integration</li>
      <li><strong>Vue 3</strong> (<code>^3.5</code>) — Composition API, <code>&lt;script setup&gt;</code></li>
      <li><strong>Vue Router 4</strong> — navigare client</li>
      <li><strong>TypeScript</strong> — tipare în pagini, composables, server</li>
    </ul>

    <h2>Styling & design system</h2>
    <ul>
      <li><strong>Tailwind CSS</strong> — utilitare + tokeni semantici în <code>tailwind.config.ts</code></li>
      <li><strong>main.css</strong> — clase DS (<code>.ds-card</code>, <code>.ds-btn-primary</code>, <code>.poem-body</code>)</li>
      <li><strong>Color schemes</strong> — teme cititor (<code>assets/css/color-schemes.css</code>, <code>utils/colorScheme.ts</code>)</li>
      <li><strong>Fonturi</strong> — Playfair (titluri/poezii), Inter (UI), JetBrains Mono (cod)</li>
      <li><strong>Iconuri</strong> — <code>@iconify/vue</code> + Heroicons</li>
    </ul>

    <h2>State & data fetching</h2>
    <ul>
      <li><strong>Pinia</strong> — state global (via <code>@pinia/nuxt</code>)</li>
      <li><strong>useFetch / $fetch</strong> — apeluri API către <code>/api/*</code></li>
      <li><strong>Composables</strong> — <code>useAuth</code>, <code>useReaderPreferences</code>, <code>useCarouselGenerator</code>, etc.</li>
    </ul>

    <h2>Internaționalizare</h2>
    <ul>
      <li><strong>@nuxtjs/i18n</strong> — locale <code>ro</code> (implicit) și <code>en</code></li>
      <li>Fișiere: <code>i18n/locales/ro.json</code>, <code>en.json</code></li>
      <li>Strategie <code>no_prefix</code> — fără prefix URL pe limbă</li>
    </ul>

    <h2>Layout-uri</h2>
    <ul>
      <li><code>default</code> — site public (nav + footer)</li>
      <li><code>account</code> — zonă utilizator cu sidebar</li>
      <li><code>admin</code> — panou staff</li>
      <li><code>auth</code> — login/signup</li>
      <li><code>docs</code> — documentație (sidebar cu tab-uri)</li>
    </ul>

    <h2>Module Nuxt</h2>
    <pre><code>@pinia/nuxt
@nuxtjs/tailwindcss
@nuxtjs/i18n
@nuxtjs/storybook  # enabled: false în dev Nuxt; rulează standalone</code></pre>
  </DocsProse>
</template>
