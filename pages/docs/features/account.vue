<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Cont & autentificare — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Features</span>
    <h1>Cont & autentificare</h1>
    <p class="lead">
      Conturi utilizatori pentru favorite, preferințe cititor, profil poet și conținut salvat.
    </p>

    <h2>Pagini</h2>
    <ul>
      <li><code>/login</code>, <code>/signup</code> — autentificare email/parolă + Google</li>
      <li><code>/account</code> — profil, preferințe cititor, temă</li>
      <li><code>/account/poems</code> — poezii trimise (profil poet)</li>
      <li><code>/account/insta-posts</code> — carousel-uri salvate</li>
    </ul>

    <h2>Autentificare</h2>
    <ul>
      <li>Email + parolă (<code>bcryptjs</code> hash)</li>
      <li>Google OAuth — <code>GET /api/auth/google</code> → callback</li>
      <li>Config runtime Google — <code>GET /api/auth/google-config</code></li>
      <li>Composable <code>useAuth</code> — stare sesiune client</li>
    </ul>

    <h2>Profil & preferințe</h2>
    <ul>
      <li>Font cititor, mărime, line-height, letter-spacing</li>
      <li>Color scheme (temă site)</li>
      <li>Flag <code>isPoet</code> — deblochează trimitere poezii</li>
    </ul>

    <h2>API user</h2>
    <ul>
      <li><code>POST /api/user/register</code>, <code>POST /api/user/login</code></li>
      <li><code>GET /api/user/me</code>, <code>PATCH /api/user/me/*</code></li>
      <li><code>GET|POST /api/user/favorites</code></li>
      <li><code>GET|POST|DELETE /api/user/poems/*</code></li>
    </ul>

    <h2>Layout</h2>
    <p>Zonele account folosesc <code>layouts/account.vue</code> cu sidebar desktop și tab bar mobile.</p>
  </DocsProse>
</template>
