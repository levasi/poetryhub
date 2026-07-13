<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Bază de date — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Stack</span>
    <h1>Bază de date</h1>
    <p class="lead">
      PoetryHub folosește <strong>PostgreSQL</strong> cu <strong>Prisma ORM</strong>. Schema este în <code>prisma/schema.prisma</code>.
    </p>

    <h2>Provider & conexiune</h2>
    <ul>
      <li>Provider: <code>postgresql</code></li>
      <li>URL: <code>DATABASE_URL</code> (env)</li>
      <li>Compatibil: Neon, Supabase, orice Postgres gestionat</li>
      <li>Binary targets Prisma: <code>native</code>, <code>rhel-openssl-3.0.x</code> (Vercel/Lambda)</li>
    </ul>

    <h2>Modele principale</h2>
    <h3>Conținut</h3>
    <ul>
      <li><strong>Author</strong> — autori (slug, bio, ani viață, naționalitate, portret)</li>
      <li><strong>Poem</strong> — poezii (conținut text, excerpt, limbă, sursă, featured, setări carousel JSON)</li>
      <li><strong>Tag</strong> + <strong>PoemTag</strong> — tag-uri pe categorii (mood, theme, era…)</li>
    </ul>
    <h3>Utilizatori</h3>
    <ul>
      <li><strong>User</strong> — cont public (email, Google ID, rol, preferințe cititor, profil poet)</li>
      <li><strong>Favorite</strong> — poezii favorite (many-to-many user ↔ poem)</li>
      <li><strong>UserPoemDraft</strong> — draft-uri din workspace Write</li>
      <li><strong>UserInstaPost</strong> — postări carousel salvate (payload JSON)</li>
      <li><strong>AdminUser</strong> — conturi panou admin separat</li>
    </ul>
    <h3>Configurare site</h3>
    <ul>
      <li><strong>SiteSettings</strong> — singleton (ex. afișare switch limbă)</li>
      <li><strong>CarouselSiteDefaults</strong> — defaults generator Instagram</li>
      <li><strong>ImportLog</strong> — jurnal importuri bulk</li>
    </ul>
    <h3>Lexicon Write</h3>
    <ul>
      <li><strong>WriteLexiconWord</strong> — cuvinte românești (silabe, rime, definiții, sinonime)</li>
      <li><strong>WriteCachedLookup</strong> — cache definiții externe</li>
    </ul>

    <h2>Comenzi Prisma</h2>
    <pre><code>npm run db:push      # Sync schema (dev)
npm run db:migrate   # Migrări dev
npm run db:seed      # Seed date
npm run db:studio    # UI explorare date</code></pre>

    <h2>Indexare</h2>
    <p>
      Schema include indexuri compuse pentru pattern-uri frecvente: listări pe limbă + dată publicare,
      featured, slug-uri, căutări lexicon pe <code>endingKey</code> și <code>syllableCount</code>.
    </p>
  </DocsProse>
</template>
