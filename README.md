# PoetryHub

A modern, typography-focused platform to **read**, **discover**, **write**, and **share** poetry — with a strong focus on Romanian literature and tools for poets.

Built with **Nuxt 3**, **Tailwind CSS**, **Prisma**, and **PostgreSQL**. Deploys to **Vercel**.

---

## Main features

### Reading & discovery

- **Homepage** — featured poems, recent additions, mood/theme browsing, random poem (3D dice)
- **Poem library** — grid/list with filters by author, tag, source, language; URL-synced state
- **Poem reader** — clean, immersive layout; customizable typography (font, size, line height, spacing)
- **Stanza / slide mode** — read one stanza at a time, Instagram-carousel style
- **Author pages** — bio, nationality, life years, portrait, paginated bibliography
- **Search** — full-text search across poems and authors
- **Daily poem** — poem of the day endpoint and page
- **Favorites** — save poems locally; sync to your account when signed in
- **Related poems** — suggestions on the poem detail page
- **AI literary insight** — optional Claude-powered commentary on a poem (when `ANTHROPIC_API_KEY` is set)
- **i18n** — Romanian and English UI (`@nuxtjs/i18n`)
- **Themes** — reader color schemes (paper, ink, sepia, etc.)

### Writing workspace (`/write`)

Romanian-focused **dictionary and rhyme assistant** for composing lyrics and poetry:

- **Multi-mode lexicon search** — fuzzy match, prefix/suffix, contains (with syllable-aware matching), anagram, exact
- **Synonyms & antonyms** — expand from the lexicon (Wiktionary-backed `synonymsJson` / `antonymsJson`)
- **Definitions** — DB first, then Wikipedia RO, then Wiktionary RO
- **Lyrics editor** — write verses alongside the dictionary panel; resizable split layout
- **Saved words** — pin useful words to a project list
- **Drafts & publish** — save drafts to your account; publish poems when logged in
- **Poet profile** — optional switch to “poet” mode after first save

Lexicon data lives in `WriteLexiconWord` (import via `npm run write:lexicon`, DEX, SQLite, or Wiktionary backfill — see [Scripts](#scripts) below).

### Instagram carousel generator (`/carousel-generator`)

- Build **slide-by-slide carousels** from any poem (split by stanza)
- Customize fonts, colors, and branding per slide
- **Export PNG slides** or a ZIP; per-poem font settings stored in the database
- Site-wide carousel defaults configurable in admin

### Accounts & community

- **Sign up / sign in** — email + password, or **Google OAuth** (when configured)
- **Account** — profile, preferences (reader settings sync), your published poems
- **User-published poems** — poets can publish from `/write` to the public catalog
- **Favorites API** — server-backed favorites when authenticated

### Admin (`/admin`)

JWT-secured dashboard (admin role):

- **Poems & authors** — full CRUD
- **Bulk import** — [PoetryDB](https://poetrydb.org), JSON paste, Romanian corpus presets
- **Users** — user management
- **Site settings** — appearance and carousel defaults
- **Instagram post helper** — admin tooling for social assets

### Content pipeline

- **CLI importers** — PoetryDB, Romanian Voice, Wikisource (Alecsandri), etc.
- **Author enrichment** — portraits and life years from Wikidata
- **SEO** — dynamic `sitemap.xml` for poems and authors
- **Caching** — SWR on poem lists, detail, homepage, and AI insight endpoints

---

## Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Framework | Nuxt 3                        |
| UI        | Vue 3, Pinia, Iconify         |
| Styling   | Tailwind CSS + design tokens  |
| Database  | PostgreSQL (Neon or Supabase) |
| ORM       | Prisma                        |
| Auth      | JWT (`jose`) + HttpOnly cookies; Google OAuth |
| AI        | Anthropic Claude (optional)   |
| Deploy    | Vercel (Nitro preset)         |

For a deeper reference (routes, API, schema), see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/your-username/poetryhub.git
cd poetryhub
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

Get a free PostgreSQL database from [Neon](https://neon.tech) or [Supabase](https://supabase.com).

**Google sign-in on localhost:** the **Continue with Google** button appears only when **`NUXT_OAUTH_GOOGLE_CLIENT_ID`** and **`NUXT_OAUTH_GOOGLE_CLIENT_SECRET`** are both set in `.env`, and Google Cloud has redirect URI `http://localhost:3000/api/auth/google/callback`. Restart `npm run dev` after editing.

### 3. Set up the database

```bash
npm run db:push     # push schema to DB (no migration files)
npm run db:seed     # create admin user + default tags
```

### 4. Import poems (optional)

```bash
npm run poems:import                    # 30 random poems from PoetryDB
npm run poems:import -- --count=100     # 100 poems
npm run poems:import -- --author="Keats"  # all poems by an author
```

### 5. Run development server

```bash
npm run dev
# → http://localhost:3000
```

### 6. Use the **production** database locally (optional)

Your local `.env` can stay on a dev Postgres; **`DATABASE_URL` in `.env.local` overrides it** (see `server/utils/prisma.ts`).

**From Vercel** (recommended — pulls Production env vars including `DATABASE_URL`, `JWT_SECRET`, etc.):

The Vercel CLI does not install cleanly on **Node 25**; these scripts prefer **Homebrew `node@22`** (`brew install node@22` if needed).

```bash
npm run vercel:link      # once — link this folder to the Vercel project
npm run env:pull:prod    # writes / updates .env.local
npm run dev
```

**Manual:** copy the Production `DATABASE_URL` from Vercel → Settings → Environment Variables into `.env.local` as a single line (see `.env.local.example`).

**Caution:** With a live `DATABASE_URL`, do **not** run `npm run db:push` or `db:migrate` unless you mean to change the production schema.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `nuxt build`) |
| `npm run db:push` / `db:migrate` / `db:seed` / `db:studio` | Database schema & seed |
| `npm run poems:import` | Import poems from PoetryDB |
| `npm run poems:import-ro` | Romanian Voice corpus |
| `npm run write:lexicon` | Import write-tool lexicon |
| `npm run write:dex` | Import DEX definitions into lexicon |
| `npm run write:wiktionary-relations` | Backfill `synonymsJson` / `antonymsJson` from ro.wiktionary |
| `npm run write:lexicon:from-sqlite` | Copy lexicon from rhymescheme SQLite (`RHYMESCHEME_SQLITE_PATH`) |
| `npm run authors:portraits` | Backfill author images |
| `npm run authors:life-years` | Fetch birth/death years from Wikidata |

---

## Project structure (overview)

```
poetryhub/
├── pages/              # Routes: poems, authors, write, carousel-generator, account, admin
├── components/         # PoetryCard, PoetryViewer, carousel, write editor, …
├── composables/        # useAuth, usePoems, useFavorites, useCarouselGenerator, …
├── stores/             # Pinia: write lyrics & projects
├── lib/rhyme/          # Lexicon search, syllables, normalization
├── server/api/         # Nitro REST handlers
├── prisma/schema.prisma
├── scripts/            # Import, seed, lexicon backfill CLIs
└── docs/ARCHITECTURE.md
```

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add . && git commit -m "init" && git push
```

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
2. Framework: **Nuxt.js** (auto-detected)
3. Add environment variables from `.env.example`

### 3. Environment variables on Vercel

| Variable              | Value                              |
|-----------------------|------------------------------------|
| `DATABASE_URL`        | Your Neon/Supabase connection string |
| `JWT_SECRET`          | Random 64-char hex string          |
| `ADMIN_EMAIL`         | Your admin email                   |
| `ADMIN_PASSWORD`      | Strong password                    |
| `NUXT_PUBLIC_APP_URL` | `https://your-app.vercel.app`      |
| `NUXT_OAUTH_GOOGLE_*` | Optional Google OAuth              |
| `ANTHROPIC_API_KEY`   | Optional AI insight & enrichment   |

### 4. Run seed on first deploy

After first deploy, run locally with production `DATABASE_URL`:

```bash
DATABASE_URL="your-prod-url" npm run db:seed
DATABASE_URL="your-prod-url" npm run poems:import -- --count=100
```

---

## Admin panel

Open `/admin` while signed in with an account that has the **admin** role (e.g. seed admin, or Google login if promoted). Password-based admin JWT (`POST /api/auth/login`) remains available for tooling if configured.

**Bulk import** — Admin → Import, or `POST /api/import/bulk`:

```json
[
  {
    "title": "Ozymandias",
    "content": "I met a traveller from an antique land,\nWho said—Two vast and trunkless legs of stone\nStand in the desert…",
    "author": "Percy Bysshe Shelley",
    "language": "en",
    "tags": ["classic", "ruins", "time"]
  }
]
```

---

## License

MIT
