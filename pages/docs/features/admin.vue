<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Admin — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Features</span>
    <h1>Admin</h1>
    <p class="lead">
      Panou staff pentru gestionarea conținutului, utilizatorilor și importurilor.
    </p>

    <h2>Acces</h2>
    <ul>
      <li>Rute <code>/admin/*</code> — layout <code>admin</code> + middleware <code>admin</code></li>
      <li>Login separat: <code>POST /api/auth/login</code> (model <code>AdminUser</code>)</li>
      <li>Roluri staff pe <code>User</code>: editor, moderator, admin — <code>utils/roles.ts</code></li>
    </ul>

    <h2>Secțiuni panou</h2>
    <ul>
      <li><code>/admin</code> — dashboard</li>
      <li><code>/admin/poems</code> — CRUD poezii</li>
      <li><code>/admin/authors</code> — CRUD autori + portrete</li>
      <li><code>/admin/users</code> — gestionare roluri utilizatori</li>
      <li><code>/admin/setari</code> — setări site</li>
      <li><code>/admin/insta-post</code> — defaults carousel</li>
      <li><code>/admin/import</code> — import PoetryDB, corpus românesc, bulk</li>
    </ul>

    <h2>API admin</h2>
    <ul>
      <li><code>GET /api/admin/users</code></li>
      <li><code>PATCH /api/admin/users/:id/role</code></li>
      <li><code>POST /api/import/*</code> — importuri</li>
      <li><code>POST /api/admin/enrich-poems</code> — enrichment AI date</li>
      <li><code>PUT /api/site/settings</code>, <code>PUT /api/carousel/defaults</code></li>
    </ul>

    <h2>Import & scripturi</h2>
    <p>Scripturi CLI în <code>scripts/</code> pentru seed, import poezii, lexicon, portrete autori — rulează local sau în CI, nu din UI public.</p>
  </DocsProse>
</template>
