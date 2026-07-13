<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Storybook — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Dev</span>
    <h1>Storybook</h1>
    <p class="lead">
      Documentație vizuală a componentelor UI în izolare, cu Storybook 9 și integrare Nuxt.
    </p>

    <h2>Stack</h2>
    <ul>
      <li><strong>Storybook 9</strong> (<code>~9.0.5</code>)</li>
      <li><strong>@nuxtjs/storybook</strong> + <strong>@storybook-vue/nuxt</strong></li>
      <li>Addons: <code>@storybook/addon-docs</code>, <code>@storybook/addon-links</code></li>
      <li>Autodocs via tag <code>autodocs</code></li>
    </ul>

    <h2>Configurare</h2>
    <ul>
      <li><code>.storybook/main.ts</code> — stories din <code>components/**/*.stories.ts</code></li>
      <li><code>.storybook/preview.ts</code> — decorator cu <code>bg-surface-page</code>, <code>data-color-scheme="paper"</code></li>
      <li>Nuxt module: <code>storybook.enabled: false</code> — rulează standalone, nu în dev Nuxt</li>
    </ul>

    <h2>Comenzi</h2>
    <pre><code>npm run storybook        # Dev server port 6006
npm run build-storybook   # Static build → storybook-static/</code></pre>

    <h2>Convenții stories</h2>
    <ul>
      <li>Colocate: <code>Component.vue</code> + <code>Component.stories.ts</code></li>
      <li>CSF3 cu <code>satisfies Meta&lt;typeof Component&gt;</code></li>
      <li>Ierarhie titluri: <code>UI/…</code>, <code>Carousel/…</code>, etc.</li>
      <li>Acoperă: Default, stări edge (loading, empty, disabled), Interactive când e cazul</li>
    </ul>

    <h2>Stories existente</h2>
    <ul>
      <li>DS: <code>DsBanner</code>, <code>DsEmpty</code>, <code>DsFleuron</code>, <code>DsSheet</code>, <code>DsTabs</code></li>
      <li>UI: <code>PoetryCard</code>, <code>TagBadge</code>, <code>AppNav</code>, <code>PaginationNav</code>, <code>Alert</code></li>
      <li><code>Buttons</code>, <code>ColorSchemeSwitch</code>, <code>CloseButton</code></li>
    </ul>

    <h2>Workflow</h2>
    <ol>
      <li>Pornește Nuxt: <code>npm run dev</code> (port 3000)</li>
      <li>Pornește Storybook: <code>npm run storybook</code> (port 6006)</li>
      <li>Storybook proxy-uiește asset-uri Nuxt pentru context complet</li>
    </ol>
  </DocsProse>
</template>
