# PoetryHub — Architecture Reference

> Last updated: 2026-04-03

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Nuxt 3 | 3.14.0 |
| UI | Vue 3 | 3.5.13 |
| Styling | TailwindCSS | 6.12.1 |
| State | Pinia | 3.0.0 |
| i18n | @nuxtjs/i18n | 10.2.4 |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL (Neon/Supabase) | — |
| Auth | JWT via `jose` + HttpOnly cookies | jose 5.9.6 |
| Validation | Zod | 3.23.8 |
| AI | @anthropic-ai/sdk | ^0.80.0 |
| Hosting | Vercel (Nitro serverless preset) | — |
| Icons | @iconify/vue | 5.0.0 |
| Canvas export | html2canvas + jszip | 1.4.1 / 3.10.1 |
| Client search | fuse.js | 7.1.0 |

---

## Folder Structure

```
poetryhub/
├── assets/css/main.css          # Tailwind imports + semantic CSS tokens
├── components/                  # Vue components (see below)
├── composables/                 # Vue composables (see below)
├── docs/                        # Project documentation (this file)
├── i18n/locales/                # en.json, ro.json (520+ keys each)
├── layouts/
│   ├── default.vue              # Public: FavoritesFlash + AppNav + slot + AppFooter
│   └── admin.vue                # Admin: sidebar + route guard
├── middleware/
│   └── admin.ts                 # Client-side guard: requires role=admin JWT
├── pages/                       # File-based routing (21 routes)
├── plugins/                     # Nuxt client/server plugins
├── prisma/
│   └── schema.prisma            # DB schema (11 models)
├── public/                      # Static assets
├── server/
│   ├── api/                     # Nitro API handlers
│   ├── plugins/                 # Nitro server plugins (rateLimiter, etc.)
│   ├── routes/                  # Nitro non-API routes (sitemap.xml)
│   └── utils/                   # Shared server utilities
├── stores/                      # Pinia stores (write tool)
├── tailwind.config.ts           # Design tokens + semantic vars
└── nuxt.config.ts               # Nuxt + Nitro config
```

---

## Pages (Routes)

| Route | File | Description |
|-------|------|-------------|
| `/` | `pages/index.vue` | Homepage: hero, featured, recent, mood/theme browsing |
| `/poems` | `pages/poems/index.vue` | Poems grid/list with filters + search |
| `/poems/[slug]` | `pages/poems/[slug].vue` | Poem reader + insight panel + related poems |
| `/authors` | `pages/authors/index.vue` | Authors list with search |
| `/authors/[slug]` | `pages/authors/[slug].vue` | Author profile: bio, bibliography, poems |
| `/search` | `pages/search.vue` | Global search (client-side fuse.js) |
| `/daily` | `pages/daily.vue` | Poem of the day |
| `/favorites` | `pages/favorites.vue` | Saved poems (local + server sync) |
| `/login` | `pages/login.vue` | User login |
| `/signup` | `pages/signup.vue` | User registration |
| `/carousel-generator` | `pages/carousel-generator.vue` | Instagram carousel builder |
| `/write` | `pages/write.vue` | Romanian dictionary + rhyme tool |
| `/admin` | `pages/admin/index.vue` | Admin dashboard |
| `/admin/poems` | `pages/admin/poems/index.vue` | Poems CRUD |
| `/admin/poems/new` | `pages/admin/poems/new.vue` | Create poem |
| `/admin/poems/[slug]` | `pages/admin/poems/[slug].vue` | Edit poem |
| `/admin/authors` | `pages/admin/authors/index.vue` | Authors CRUD |
| `/admin/authors/new` | `pages/admin/authors/new.vue` | Create author |
| `/admin/authors/[slug]` | `pages/admin/authors/[slug].vue` | Edit author |
| `/admin/import` | `pages/admin/import.vue` | Bulk import (PoetryDB, JSON, presets) |
| `/admin/aspect` | `pages/admin/aspect.vue` | Theme/appearance settings |

---

## API Routes

### Poems
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/poems` | — | List with filters: `page`, `limit`, `author`, `tag`, `source`, `featured`, `search`, `excludeSlug` |
| GET | `/api/poems/[slug]` | — | Single poem + navigation (cached 45s SWR) |
| GET | `/api/poems/daily` | — | Poem of the day |
| GET | `/api/poems/random` | — | Random poem (optional `author` param) |
| GET | `/api/poems/by-ids` | — | Batch fetch by comma-separated IDs (order preserved) |
| GET | `/api/poems/[slug]/insight` | — | Claude AI literary insight (cached 24h) |
| POST | `/api/poems` | admin JWT | Create poem |
| PUT | `/api/poems/[slug]` | admin JWT | Update poem |
| DELETE | `/api/poems/[slug]` | admin JWT | Delete poem |

### Authors
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/authors` | — | List with search |
| GET | `/api/authors/[slug]` | — | Profile + works + paginated poems |
| GET | `/api/authors/random` | — | Random author |
| POST | `/api/authors` | admin JWT | Create |
| PUT | `/api/authors/[slug]` | admin JWT | Update |
| DELETE | `/api/authors/[slug]` | admin JWT | Delete (cascades poems) |

### User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/register` | — | Register (sets JWT cookie) |
| POST | `/api/user/login` | — | Login (rate-limited: 10/IP/60s) |
| GET | `/api/user/me` | user JWT | Current user + preferences |
| POST | `/api/user/logout` | — | Clear cookie |
| PATCH | `/api/user/me/preferences` | user JWT | Save reader settings |
| GET | `/api/user/favorites` | user JWT | Favorite poem IDs |
| POST | `/api/user/favorites/[poemId]` | user JWT | Toggle favorite |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/home` | Aggregated homepage payload (featured + recent + hero + tags) |
| GET | `/api/tags` | All tags with counts |
| GET | `/api/search` | Full-text search (poems + authors) |
| GET | `/api/words` | Romanian lexicon search |
| POST | `/api/import/poetrydb` | Bulk import from PoetryDB |
| POST | `/api/import/bulk` | Import from JSON array |
| GET | `/sitemap.xml` | SEO sitemap (all poems + authors) |

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `AppNav.vue` | Sticky header: logo, nav links, auth, language/theme switchers |
| `AppFooter.vue` | Footer with quote + links |
| `PoetryCard.vue` | Poem preview card: excerpt, tags, favorite, quick-read |
| `PoetryViewer.vue` | Full poem reader: body, actions bar (save, share, stanza view), slide mode |
| `ReaderSettingsSidebar.vue` | Font/size/spacing customization drawer |
| `PoemTitle.vue` | Reusable title with carousel icon link, `variant` prop |
| `AuthorCard.vue` | Author preview: portrait, poem count, bio excerpt |
| `Dice3D.vue` | 3D animated dice for homepage random poem |
| `FavoritesFlash.vue` | Toast notification for favorite add/remove |
| `FilterPanel.vue` | Mood/theme/source/language filter sidebar (URL-synced) |
| `TagBadge.vue` | Clickable tag pill (mood/theme, styled by category) |
| `PaginationNav.vue` | Page navigation |
| `PoemCarouselIcon.vue` | Icon linking to carousel generator with `?slug=` pre-loaded |

---

## Composables

| Composable | Purpose |
|-----------|---------|
| `useAuth.ts` | User session: login, register, logout, `isLoggedIn` |
| `useFavorites.ts` | Toggle, clear, sync server↔local, shared state |
| `usePoems.ts` | Fetch + paginate poems, `useDailyPoem`, `usePoem`, random |
| `useFilters.ts` | URL-synced filter state (author, tag, source, search, page) |
| `useSearch.ts` | Debounced full-text search |
| `useColorScheme.ts` | Color scheme state (paper/ink/sepia/qi), DOM + localStorage |
| `useReaderPreferences.ts` | Font/size/line-height/letter-spacing, account sync or localStorage |
| `useCarouselGenerator.ts` | Slide splitting, PNG export (html2canvas), ZIP (jszip) |
| `useTagLabel.ts` | i18n tag label lookup |

---

## Database Schema (Prisma)

### Models

```
Author        id, name, slug*, bio, birthYear, deathYear, nationality, imageUrl
Poem          id, title, slug*, content, excerpt, authorId→Author, language, source,
              readingTime, writtenYear, writtenPeriod, featured, publishedAt,
              carouselFontSettings (JSON)
Tag           id, name, slug*, category (mood|theme|language|era|style), color
PoemTag       poemId→Poem, tagId→Tag   [junction]
User          id, email*, passwordHash, name, role (user|admin),
              poemFontFamily, poemFontSize, poemLineHeight, poemLetterSpacing
Favorite      userId→User, poemId→Poem  [junction]
AdminUser     id, email*, passwordHash, name  [legacy — migrate to User.role]
CarouselSiteDefaults  id, config (JSON)  [singleton row]
ImportLog     id, source, status, imported, skipped, errors, details, createdAt
WriteLexiconWord     word, baseForm, type, syllables, endingKey, definition, synonyms
WriteCachedLookup    key, source, payload, createdAt
```

### Key Indexes
- `Poem.slug` (unique), `Poem.language`, `Poem.featured`, `Poem.publishedAt`
- `Author.slug` (unique)
- `Tag.slug` (unique), `Tag.category`
- `User.email` (unique)

---

## Stores (Pinia)

| Store | File | Purpose |
|-------|------|---------|
| Write lyrics | `stores/writeLyrics.ts` | Search state, results, cache for `/write` tool |
| Write projects | `stores/writeProjects.ts` | Saved writing projects (client-side) |

---

## Environment Variables

### Private (server-only)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `ADMIN_EMAIL` | `admin@poetryhub.com` | Initial admin account email |
| `ADMIN_PASSWORD` | `admin123` | Initial admin account password |
| `POETRY_DB_URL` | `https://poetrydb.org` | PoetryDB API base URL |
| `ANTHROPIC_API_KEY` | — | Claude API key (insight endpoint + poem enrichment) |

### Public (client + server)
| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_PUBLIC_APP_URL` | `http://localhost:3000` | Full app URL (used in og:image, sitemap, etc.) |
| `NUXT_PUBLIC_CAROUSEL_DEFAULTS_ADMIN_EMAIL` | — | Email allowed to save carousel defaults |

---

## Caching Strategy

| Layer | Mechanism | TTL |
|-------|-----------|-----|
| Build assets (`/_nuxt/**`) | `Cache-Control: immutable` | 1 year |
| Poem detail (`/api/poems/[slug]`) | `defineCachedEventHandler` SWR | 45s |
| Poems list (`/api/poems`) | `defineCachedEventHandler` SWR | 60s |
| Homepage payload (`/api/home`) | `defineCachedEventHandler` SWR | 60s |
| Poem insight (`/api/poems/[slug]/insight`) | `defineCachedEventHandler` SWR | 24h |
| Sitemap (`/sitemap.xml`) | `Cache-Control` | 1h |
| Favicon | `Cache-Control` | 24h |

---

## Security

| Concern | Implementation |
|---------|---------------|
| Authentication | JWT signed with `jose`, stored in HttpOnly + SameSite=Lax cookie |
| Password storage | `bcryptjs` hash |
| Input validation | `zod` schemas on all POST/PUT/PATCH endpoints |
| Admin authorization | `requireAdmin()` server util checks `role === 'admin'` in JWT |
| Rate limiting | In-memory 10 attempts/IP/60s on `/api/user/login` (Nitro plugin) |
| HTTPS | Enforced by Vercel in production |

---

## Deployment

```bash
# Local dev
npm run dev

# Build
npm run build          # runs: prisma generate && nuxt build

# DB operations
npm run db:push        # push schema changes (no migration)
npm run db:migrate     # create & apply migration
npm run db:seed        # seed initial data
npm run db:studio      # Prisma Studio GUI

# Import poems
npm run poems:import   # PoetryDB default import
```

**Vercel deploy:** Push to `main` → auto-deploy. Set env vars in Vercel dashboard.
