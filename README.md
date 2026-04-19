# PoetryHub

A modern, typography-focused platform to read, discover, and share poetry.
Built with **Nuxt 3**, **TailwindCSS**, **Prisma**, and **PostgreSQL**. Deploys to **Vercel**.

---

## Features

- **Public site** — browse poems by mood, theme, author, language; full-text search; random poem; daily poem
- **Poetry reader** — clean immersive layout + Instagram-style carousel/slide mode per stanza
- **Author pages** — bio, nationality, years, paginated poem list
- **Favorites** — save poems to localStorage (no account needed)
- **Admin panel** — JWT-secured dashboard to add/edit/delete poems and authors
- **Bulk import** — import from [PoetryDB](https://poetrydb.org) API or paste JSON

---

## Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Framework | Nuxt 3                      |
| Styling   | TailwindCSS + custom tokens |
| Database  | PostgreSQL (Neon or Supabase) |
| ORM       | Prisma                      |
| Auth      | JWT via `jose` + HttpOnly cookies |
| Deploy    | Vercel (Nitro preset)       |

---

## Quick Start

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

## Project Structure

```
poetryhub/
├── assets/css/main.css          # Global styles + Tailwind
├── components/
│   ├── AppNav.vue               # Sticky navigation bar
│   ├── AppFooter.vue
│   ├── PoetryCard.vue           # Poem card (grid/list)
│   ├── PoetryViewer.vue         # Full reader + carousel mode
│   ├── AuthorCard.vue           # Author card
│   ├── SearchBar.vue            # Debounced search input
│   ├── TagBadge.vue             # Clickable/linked tag pill
│   └── PaginationNav.vue        # Page number navigation
├── composables/
│   ├── usePoems.ts              # Fetch + paginate poems
│   ├── useSearch.ts             # Debounced full-text search
│   ├── useFilters.ts            # URL-synced filter state
│   ├── useFavorites.ts          # localStorage favorites
│   └── useAdmin.ts             # Admin session
├── layouts/
│   ├── default.vue              # Public layout (nav + footer)
│   └── admin.vue                # Admin sidebar layout
├── middleware/admin.ts          # Client-side admin route guard
├── pages/
│   ├── index.vue                # Homepage
│   ├── poems/index.vue          # Poem grid + filters
│   ├── poems/[slug].vue         # Poem reader
│   ├── authors/index.vue        # Authors list
│   ├── authors/[slug].vue       # Author profile
│   ├── search.vue               # Search page
│   ├── daily.vue                # Daily poem
│   ├── favorites.vue            # Saved poems
│   └── admin/
│       ├── login.vue
│       ├── index.vue            # Dashboard
│       ├── poems/               # CRUD
│       ├── authors/             # CRUD
│       └── import.vue           # Bulk import UI
├── prisma/schema.prisma         # DB schema
├── scripts/
│   ├── import-poems.ts          # CLI importer (PoetryDB)
│   └── seed.ts                  # Admin + tags seed
└── server/
    ├── api/
    │   ├── poems/               # GET, POST, PUT, DELETE, random, daily
    │   ├── authors/             # GET, POST, PUT, DELETE
    │   ├── tags/                # GET, POST
    │   ├── import/              # poetrydb.post.ts, bulk.post.ts
    │   └── auth/                # login, logout, me
    └── utils/
        ├── prisma.ts            # Singleton Prisma client
        ├── auth.ts              # JWT sign/verify/guard
        └── slug.ts              # Slugify, excerpts, reading time
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

### 4. Run seed on first deploy

After first deploy, run locally with production `DATABASE_URL`:

```bash
DATABASE_URL="your-prod-url" npm run db:seed
DATABASE_URL="your-prod-url" npm run poems:import -- --count=100
```

---

## Admin Panel

Open `/admin` while signed in with an account that has access (e.g. Google login on `/login`, then visit `/admin`). Password-based admin JWT (`POST /api/auth/login`) remains available for tooling if configured; there is no separate `/admin/login` page.

---

## Bulk Import JSON Format

POST to `/api/import/bulk` or paste in Admin → Import:

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
