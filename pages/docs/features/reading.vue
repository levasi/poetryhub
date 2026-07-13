<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Citire & descoperire — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Features</span>
    <h1>Citire & descoperire</h1>
    <p class="lead">
      Experiența principală PoetryHub: citire confortabilă, descoperire editorială și personalizare a cititorului.
    </p>

    <h2>Pagini</h2>
    <ul>
      <li><code>/</code> — homepage cu poezii featured, autori, navigare tematică</li>
      <li><code>/descopera</code> — flux de descoperire (random, filtre)</li>
      <li><code>/poems</code> — catalog cu filtre, căutare, tag-uri</li>
      <li><code>/poems/:slug</code> — cititor poezie (<code>PoemReader</code>, <code>PoetryViewer</code>)</li>
      <li><code>/authors</code>, <code>/authors/:slug</code> — autori și opere</li>
      <li><code>/favorites</code> — lista de favorite (autentificat)</li>
    </ul>

    <h2>Cititor</h2>
    <ul>
      <li>Preferințe font, mărime, line-height, letter-spacing — <code>useReaderPreferences</code></li>
      <li>Teme culoare (paper, ink, night…) — <code>ColorSchemeSwitch</code></li>
      <li>Sidebar setări pe desktop; acțiuni mobile — <code>ReaderMobileActions</code></li>
      <li>Definiții cuvinte la click — <code>/api/word-definition</code></li>
    </ul>

    <h2>API relevante</h2>
    <ul>
      <li><code>GET /api/home</code> — payload agregat homepage</li>
      <li><code>GET /api/home/for-you</code> — recomandări user</li>
      <li><code>GET /api/poems</code> — listă cu query params</li>
      <li><code>GET /api/poems/:slug</code> — detalii + autor + tag-uri</li>
      <li><code>POST /api/user/favorites/:poemId</code> — toggle favorit</li>
    </ul>

    <h2>Componente cheie</h2>
    <ul>
      <li><code>PoetryCard</code>, <code>PoemTitle</code>, <code>TagBadge</code></li>
      <li><code>SearchBar</code>, <code>FilterPanel</code></li>
      <li><code>HomeAuthorsColumn</code></li>
    </ul>
  </DocsProse>
</template>
