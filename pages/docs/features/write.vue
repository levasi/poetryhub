<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Write — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Features</span>
    <h1>Scrie (Write)</h1>
    <p class="lead">
      Workspace pentru compunere poetică în română, cu dicționar, rime și salvare draft-uri.
    </p>

    <h2>Pagină</h2>
    <ul>
      <li><code>/write</code> — editor + panou instrumente (<code>WriteToolsBar</code>)</li>
    </ul>

    <h2>Funcționalități</h2>
    <ul>
      <li><strong>Căutare lexicon</strong> — minim 2 caractere; rime după ending/silabe</li>
      <li><strong>Motor de rime</strong> — <code>lib/rhyme/</code> (syllable parser, rhyme engine)</li>
      <li><strong>Definiții</strong> — DEX/Wiktionary cu cache în <code>WriteCachedLookup</code></li>
      <li><strong>Draft-uri</strong> — salvare în <code>UserPoemDraft</code> (autentificat)</li>
      <li><strong>Diacritice</strong> — normalizare română (<code>js-romanian-diacritics</code>)</li>
    </ul>

    <h2>API</h2>
    <ul>
      <li><code>GET /api/words</code> — căutare corpus lexicon</li>
      <li><code>GET /api/word-definition</code> — definiție cuvânt</li>
      <li><code>GET|POST|PUT|DELETE /api/user/drafts/*</code> — CRUD draft-uri</li>
    </ul>

    <h2>Date</h2>
    <p>
      Tabelul <code>WriteLexiconWord</code> este populat via scripturi din <code>scripts/</code>
      (<code>write:lexicon</code>, <code>write:dex</code>, etc.).
    </p>

    <h2>Testare</h2>
    <ul>
      <li><code>tests/unit/lib/rhyme/*</code> — motor rime</li>
      <li><code>tests/api/words.get.test.ts</code> — contract API</li>
      <li><code>tests/components/WriteSearchActions.test.ts</code> — UI căutare</li>
    </ul>
  </DocsProse>
</template>
