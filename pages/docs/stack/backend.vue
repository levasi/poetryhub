<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Backend — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Stack</span>
    <h1>Backend</h1>
    <p class="lead">
      API-ul PoetryHub rulează pe Nitro — framework-ul server al Nuxt — cu handler-e file-based în <code>server/api/</code>.
    </p>

    <h2>Nitro & framework</h2>
    <ul>
      <li><strong>Nitro</strong> — server engine Nuxt; fiecare fișier <code>server/api/foo.get.ts</code> devine <code>GET /api/foo</code></li>
      <li><strong>Preset Vercel</strong> — <code>nitro.preset: 'vercel'</code> în <code>nuxt.config.ts</code></li>
      <li><strong>Cache</strong> — <code>defineCachedEventHandler</code> pe rute publice frecvente; headers pe <code>/_nuxt/**</code></li>
      <li><strong>Runtime config</strong> — secrete server-only (<code>databaseUrl</code>, <code>jwtSecret</code>, chei OAuth)</li>
    </ul>

    <h2>Autentificare</h2>
    <h3>Utilizatori publici</h3>
    <ul>
      <li>Înregistrare/login email + parolă (<code>bcryptjs</code>)</li>
      <li>OAuth Google (<code>jose</code> pentru JWT, flow în <code>/api/auth/google</code>)</li>
      <li>Sesiune JWT în cookie httpOnly</li>
      <li>Roluri: <code>user</code>, <code>editor</code>, <code>moderator</code>, <code>admin</code></li>
    </ul>
    <h3>Admin panel</h3>
    <ul>
      <li>Model separat <code>AdminUser</code> + login <code>POST /api/auth/login</code></li>
      <li>Middleware <code>admin</code> pe rute <code>/admin/*</code></li>
    </ul>

    <h2>Validare & erori</h2>
    <ul>
      <li><strong>Zod</strong> — validare input pe endpoint-uri critice</li>
      <li><strong>createError</strong> (h3) — răspunsuri HTTP cu status corect (401, 403, 404, 422)</li>
      <li>Utilitare în <code>server/utils/</code> — auth, slug, cache keys, home payload</li>
    </ul>

    <h2>Integrări externe</h2>
    <ul>
      <li><strong>PoetryDB</strong> — import corpus clasic (<code>POETRY_DB_URL</code>)</li>
      <li><strong>Anthropic</strong> — enrichment opțional date poezii (<code>ANTHROPIC_API_KEY</code>)</li>
      <li><strong>Google OAuth</strong> — <code>NUXT_OAUTH_GOOGLE_CLIENT_ID</code> / <code>SECRET</code></li>
    </ul>

    <h2>Structură server</h2>
    <pre><code>server/
├── api/           # Route handlers (public API)
├── utils/         # Shared server logic
├── middleware/    # Nitro middleware (dacă există)
└── plugins/       # Nitro plugins</code></pre>

    <p>
      Vezi <NuxtLink to="/docs/api">referința API</NuxtLink> pentru lista completă de endpoint-uri.
    </p>
  </DocsProse>
</template>
