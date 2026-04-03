# PoetryHub — Product Roadmap & Audit

> Last updated: 2026-04-03

---

## Product Overview

**PoetryHub** is a bilingual (Romanian/English) poetry reading platform with:
- A curated library of classic and AI-generated poems
- A distraction-free reader with 14 fonts and full typography control
- An Instagram carousel generator (PNG/ZIP export)
- A Romanian poetry writing assistant (dictionary + rhyme finder)
- User accounts with cross-device preference and favorites sync
- A full admin panel with CRUD and bulk import

**Target users:** Romanian literature enthusiasts, content creators who post poetry on Instagram, teachers/students, writers using the `/write` tool.

---

## Feature Inventory (confirmed from code)

| Feature | Status | Notes |
|---------|--------|-------|
| Poem browsing (mood/theme/source filter) | ✅ | URL-synced filters, 12/page pagination |
| Poem reader (14 fonts, size, line height, letter spacing) | ✅ | Prefs synced to account or localStorage |
| Stanza view (slide-by-slide with keyboard nav) | ✅ | Keyboard ← → + Esc |
| Reading progress bar | ✅ | Fixed top bar |
| Daily poem page | ✅ | `/daily` |
| Favorites (local + server sync on login) | ✅ | `useFavorites.ts` |
| Authors directory + profiles | ✅ | Bio, bibliography, pagination |
| Global search (fuse.js client-side) | ✅ | Debounced, counts |
| Instagram carousel generator | ✅ | 4 themes, 13 fonts, PNG/ZIP export |
| AI-generated poems | ❌ removed | Source type removed from UI, admin forms, filters, and cards |
| Romanian dictionary + rhyme tool (`/write`) | ✅ | ~10k lexicon words |
| User accounts (register/login/logout) | ✅ | JWT HttpOnly cookies |
| Reader preference sync | ✅ | PATCH /api/user/me/preferences |
| 4 color schemes (Paper, Ink, Sepia, Qi) | ✅ | CSS vars, localStorage, no-FOUC script |
| Full i18n (Romanian + English, 520+ strings) | ✅ | @nuxtjs/i18n lazy-loaded |
| Admin panel (CRUD poems/authors, bulk import) | ✅ | Role-based JWT |
| "More by this author" section | ✅ | `/poems?author=&excludeSlug=` |
| Related poems batch fetch (favorites) | ✅ | Single `WHERE id IN (...)` query |
| Poem insight via Claude | ✅ | `/api/poems/[slug]/insight` (24h cache) |
| Social share button | ✅ | `navigator.share` + copy-link fallback |
| og:image + twitterCard meta | ✅ | Per poem and author pages |
| Sitemap XML | ✅ | `/sitemap.xml` — all poems + authors |
| Rate limiting on login | ✅ | In-memory 10 attempts/IP/60s |

**Missing / not yet implemented:**
- Shareable favorites URL (`/favorites/[username]`)
- Email subscription for daily poem
- Reading history / streaks
- User-submitted poem flow (draft → admin review → publish)
- Server-side full-text search (currently fuse.js client-side only)
- Push notifications / RSS feed
- `og:image` dynamic generation (currently uses author portrait)
- `hreflang` alternates for ro/en pages
- JSON-LD structured data (Poem + Person schemas)
- Daily poem archive (`/daily/archive`)

---

## Audit Findings

### Product (PM perspective)

**Gaps:**
1. No discovery loop after reading a poem — missing "if you liked this, try..." recommendations
2. No return trigger — daily poem exists but no email/push/RSS to bring users back
3. Carousel generator is buried in the nav — most users never discover it
4. `/write` tool is disconnected from the poem library — no "poems using this word"
5. No social proof — no "X people saved this poem" signals

**Opportunities:**
- Personalized daily poem after 5+ favorites (tag intersection, no AI cost)
- "Reading streak" counter in nav
- Weekly reading summary email: "You read 7 poems this week, mostly Melancholy..."

### UX

**Issues:**
- `carousel-generator.vue` is 43KB — needs splitting (see Architecture section)
- Empty favorites state: "Discover poems →" is weak; should show 3 inline featured poem cards
- No "active filter" indicator in the page header when filters are applied
- FilterPanel lacks counts per tag ("Melancholy (47)")

**GSAP opportunities:**
- Stanza view transitions: spring physics on slide change
- Tag cloud on homepage: stagger fade-in by category
- Carousel preview: zoom/flip on export action

### Growth / SEO

**Done:**
- `useSeoMeta` with title/description per route ✅
- `og:image` per poem/author ✅
- `sitemap.xml` ✅

**Still missing:**
- `hreflang` for ro/en alternate pages
- JSON-LD: `Poem` and `Person` schema on respective detail pages
- `og:image` dynamic generation (server-rendered card with poem text)
- Carousel export Instagram tag prompt: "Tag @poetryhub when you post"

**Viral loops to build:**
- Shareable favorites: `/favorites/[username]` public page
- Copy-poem-as-image button (for WhatsApp sharing)
- "Daily poem" email capture at `/daily` page

### Technical Debt

| Issue | Priority | Fix |
|-------|----------|-----|
| `carousel-generator.vue` at 43KB (single file) | High | Split into components + composables |
| Client-side fuse.js search won't scale past ~500 poems | Medium | Add `/api/search?q=` with Postgres `ILIKE` |
| Dual admin user tables (`AdminUser` + `User` with role) | Medium | Migrate to single `User` table |
| No rate limiting on `/api/user/register` | Low | Extend rate limiter plugin |
| `enrichPoemWrittenDate` runs on every cache miss | Low | Add `writtenDateEnrichedAt` guard (already has field, check it's used) |

---

## Roadmap

### ⚡ Quick Wins (1–7 days) — Done in this session

- [x] Sitemap XML (`/sitemap.xml`)
- [x] `og:image` + twitterCard on poem and author pages
- [x] Share button on poem reader (native share + copy link)
- [x] Poem Insight via Claude (`/api/poems/[slug]/insight`)
- [x] Rate limiting on `/api/user/login`

### 🔧 Mid-term (2–4 weeks)

- [ ] Split `carousel-generator.vue` into `CarouselPreview`, `CarouselControls`, `CarouselExportDialog` + `useCarouselExport.ts`
- [ ] Server-side full-text search endpoint (`/api/search?q=` using Postgres `ILIKE` or `pg_trgm`)
- [ ] Shareable favorites page (`/favorites/[username]`, add `isPublic` to User model)
- [ ] `/write` save drafts to server (new `Draft` model + Pinia sync)
- [ ] Daily poem archive (`/daily/archive` — last 30 days)
- [ ] Tag counts in FilterPanel (already returned from `/api/tags`)
- [ ] hreflang alternates + JSON-LD structured data

### 🚀 Long-term (1–3 months)

- [ ] AI semantic search (Claude embeddings for "poems about loss in autumn")
- [ ] Poem recommendations engine (tag intersection + reading history model)
- [ ] User-submitted poems (submission form → admin review queue → publish)
- [ ] Email digest via Resend (daily poem, weekly summary)
- [ ] Instagram OAuth direct publish from carousel generator
- [ ] PWA manifest + offline favorites (service worker)
- [ ] AI poem completion in `/write` (first stanza → Claude continues in chosen style)

---

## Monetization Options

1. **Reader Pro (€3/month)** — Free: 3 fonts, 2 color schemes. Paid: all 14 fonts, all 4 schemes, reading stats. Infrastructure already built.
2. **Carousel Pro (€5/month)** — Free: 2 themes + watermark. Paid: all 4 themes, no watermark, Instagram direct publish.
3. **School License (€99/year)** — Full platform + teacher dashboard + assignment tracking. The admin CRUD is already built.

---

## Startup Ideas from This Codebase

1. **PoetryHub for Schools** — White-label the reading platform for Romanian literature teachers. Add student accounts, reading assignments, annotation tools. B2B SaaS with annual contracts.
2. **Versuri.ai** — Spin off the carousel generator + write tool for Romanian music/lyrics creators. The dictionary + rhyme finder + Instagram export is a complete product for an underserved niche.
3. **PoemCast** — Daily poem audio subscription via ElevenLabs (Romanian voice model). Send as podcast episode or WhatsApp audio. €2/month. Content library and daily poem infra already built.
