<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Design system — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Dev</span>
    <h1>Design system</h1>
    <p class="lead">
      Tokeni semantici, componente DS și convenții vizuale pentru un produs literar, calm și accesibil.
    </p>

    <h2>Surse de adevăr</h2>
    <ul>
      <li><code>tailwind.config.ts</code> — tokeni Tailwind</li>
      <li><code>assets/css/main.css</code> — clase utilitare și componente CSS</li>
      <li><code>assets/css/color-schemes.css</code> — variabile teme cititor</li>
      <li><code>components/ds/</code> — primitive Vue reutilizabile</li>
    </ul>

    <h2>Culori semantice</h2>
    <table>
      <thead>
        <tr><th>Token</th><th>Utilizare</th></tr>
      </thead>
      <tbody>
        <tr><td><code>surface-page</code>, <code>surface-raised</code></td><td>Fundaluri</td></tr>
        <tr><td><code>content</code>, <code>content-muted</code>, <code>content-soft</code></td><td>Ierarhie text</td></tr>
        <tr><td><code>edge</code>, <code>edge-subtle</code></td><td>Borduri</td></tr>
        <tr><td><code>brand</code>, <code>brand-soft</code></td><td>Accent auriu / CTA</td></tr>
        <tr><td><code>danger</code>, <code>danger-soft</code></td><td>Erori, acțiuni distructive</td></tr>
      </tbody>
    </table>

    <h2>Componente DS</h2>
    <ul>
      <li><code>DsBanner</code> — mesaje informative</li>
      <li><code>DsEmpty</code> — stări goale</li>
      <li><code>DsFleuron</code> — ornament decorativ</li>
      <li><code>DsSheet</code> — panou mobil (drawer)</li>
      <li><code>DsTabs</code> / <code>DsTab</code> — navigare tab-uri</li>
      <li><code>DsSkeleton</code> — loading placeholders</li>
    </ul>

    <h2>Clase CSS</h2>
    <ul>
      <li><code>.ds-card</code>, <code>.ds-btn-primary</code>, <code>.ds-btn-secondary</code></li>
      <li><code>.ds-input</code>, <code>.ds-link</code>, <code>.ds-icon-btn</code></li>
      <li><code>.poem-body</code>, <code>.poem-text</code> — corp poezie</li>
      <li><code>.section-title</code>, <code>.ds-eyebrow</code> — titluri secțiune</li>
    </ul>

    <h2>Tipografie & spacing</h2>
    <ul>
      <li><code>max-w-content</code> (72rem) — shell pagină</li>
      <li><code>max-w-reading</code> — lungime optimă citire</li>
      <li><code>text-display-sm</code> — titluri hero fluide</li>
      <li>Shadows: <code>shadow-ds-nav</code>, <code>shadow-ds-card</code>, <code>shadow-ds-popover</code></li>
      <li>Radius: <code>rounded-ds-sm</code> … <code>rounded-ds-xl</code></li>
    </ul>

    <h2>Storybook</h2>
    <p>
      Componentele DS au stories colocate pentru documentație vizuală.
      Vezi <NuxtLink to="/docs/development/storybook">secțiunea Storybook</NuxtLink>.
    </p>

    <h2>Verificare tokeni</h2>
    <pre><code>npm run check:legacy-tokens   # scripts/check-legacy-tokens.mjs</code></pre>
    <p>Script CI care previne reintroducerea scalelor legacy <code>ink</code> / <code>gold</code> / <code>rose</code>.</p>
  </DocsProse>
</template>
