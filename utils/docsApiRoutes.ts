export type ApiRouteDoc = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  auth?: 'public' | 'user' | 'admin' | 'staff'
}

export type ApiRouteGroup = {
  id: string
  title: string
  routes: ApiRouteDoc[]
}

export const apiRouteGroups: ApiRouteGroup[] = [
  {
    id: 'home',
    title: 'Home & discovery',
    routes: [
      { method: 'GET', path: '/api/home', summary: 'Payload pagină principală (featured, autori, tag-uri)', auth: 'public' },
      { method: 'GET', path: '/api/home/for-you', summary: 'Recomandări personalizate pentru utilizator autentificat', auth: 'user' },
      { method: 'GET', path: '/api/poems/random', summary: 'Poezie aleatoare', auth: 'public' },
      { method: 'GET', path: '/api/authors/random', summary: 'Autor aleator', auth: 'public' },
    ],
  },
  {
    id: 'poems',
    title: 'Poems',
    routes: [
      { method: 'GET', path: '/api/poems', summary: 'Listă poezii cu filtre, paginare, căutare', auth: 'public' },
      { method: 'POST', path: '/api/poems', summary: 'Creare poezie (staff)', auth: 'staff' },
      { method: 'GET', path: '/api/poems/by-ids', summary: 'Poezii după ID-uri', auth: 'public' },
      { method: 'GET', path: '/api/poems/:slug', summary: 'Detalii poezie', auth: 'public' },
      { method: 'PUT', path: '/api/poems/:slug', summary: 'Actualizare metadata poezie', auth: 'staff' },
      { method: 'DELETE', path: '/api/poems/:slug', summary: 'Ștergere poezie', auth: 'staff' },
      { method: 'GET', path: '/api/poems/:slug/insight', summary: 'Insight contextual (AI opțional)', auth: 'public' },
      { method: 'PUT', path: '/api/poems/:slug/content', summary: 'Actualizare conținut poezie', auth: 'staff' },
      { method: 'PUT', path: '/api/poems/:slug/carousel-font', summary: 'Setări font carousel per poezie', auth: 'staff' },
    ],
  },
  {
    id: 'authors',
    title: 'Authors',
    routes: [
      { method: 'GET', path: '/api/authors', summary: 'Listă autori', auth: 'public' },
      { method: 'POST', path: '/api/authors', summary: 'Creare autor', auth: 'staff' },
      { method: 'GET', path: '/api/authors/:slug', summary: 'Profil autor', auth: 'public' },
      { method: 'PUT', path: '/api/authors/:slug', summary: 'Actualizare autor', auth: 'staff' },
      { method: 'DELETE', path: '/api/authors/:slug', summary: 'Ștergere autor', auth: 'staff' },
      { method: 'POST', path: '/api/authors/:slug/portrait', summary: 'Upload portret autor', auth: 'staff' },
    ],
  },
  {
    id: 'tags',
    title: 'Tags',
    routes: [
      { method: 'GET', path: '/api/tags', summary: 'Listă tag-uri', auth: 'public' },
      { method: 'POST', path: '/api/tags', summary: 'Creare tag', auth: 'staff' },
    ],
  },
  {
    id: 'auth',
    title: 'Auth (public)',
    routes: [
      { method: 'POST', path: '/api/auth/login', summary: 'Login admin (sesiune staff)', auth: 'public' },
      { method: 'GET', path: '/api/auth/me', summary: 'Profil sesiune curentă', auth: 'user' },
      { method: 'POST', path: '/api/auth/logout', summary: 'Logout', auth: 'user' },
      { method: 'GET', path: '/api/auth/google-config', summary: 'Client ID Google (runtime)', auth: 'public' },
      { method: 'GET', path: '/api/auth/google', summary: 'Redirect OAuth Google', auth: 'public' },
      { method: 'GET', path: '/api/auth/google/callback', summary: 'Callback OAuth Google', auth: 'public' },
    ],
  },
  {
    id: 'user',
    title: 'User account',
    routes: [
      { method: 'POST', path: '/api/user/register', summary: 'Înregistrare email/parolă', auth: 'public' },
      { method: 'POST', path: '/api/user/login', summary: 'Login utilizator', auth: 'public' },
      { method: 'POST', path: '/api/user/logout', summary: 'Logout utilizator', auth: 'user' },
      { method: 'GET', path: '/api/user/me', summary: 'Profil utilizator', auth: 'user' },
      { method: 'PATCH', path: '/api/user/me/profile', summary: 'Actualizare profil', auth: 'user' },
      { method: 'PATCH', path: '/api/user/me/password', summary: 'Schimbare parolă', auth: 'user' },
      { method: 'PATCH', path: '/api/user/me/preferences', summary: 'Preferințe cititor (font, temă)', auth: 'user' },
      { method: 'PATCH', path: '/api/user/me/poet', summary: 'Activează profil poet', auth: 'user' },
      { method: 'DELETE', path: '/api/user/me', summary: 'Ștergere cont', auth: 'user' },
      { method: 'GET', path: '/api/user/favorites', summary: 'Favorite utilizator', auth: 'user' },
      { method: 'POST', path: '/api/user/favorites/:poemId', summary: 'Toggle favorit', auth: 'user' },
      { method: 'GET', path: '/api/user/poems', summary: 'Poezii trimise de poet', auth: 'user' },
      { method: 'POST', path: '/api/user/poems', summary: 'Trimite poezie nouă', auth: 'user' },
      { method: 'POST', path: '/api/user/poems/claim', summary: 'Revendică poezie importată', auth: 'user' },
      { method: 'DELETE', path: '/api/user/poems/:slug', summary: 'Șterge poezie proprie', auth: 'user' },
      { method: 'GET', path: '/api/user/drafts', summary: 'Draft-uri Write', auth: 'user' },
      { method: 'POST', path: '/api/user/drafts', summary: 'Salvează draft', auth: 'user' },
      { method: 'GET', path: '/api/user/drafts/:id', summary: 'Citește draft', auth: 'user' },
      { method: 'PUT', path: '/api/user/drafts/:id', summary: 'Actualizează draft', auth: 'user' },
      { method: 'DELETE', path: '/api/user/drafts/:id', summary: 'Șterge draft', auth: 'user' },
      { method: 'GET', path: '/api/user/insta-posts', summary: 'Postări carousel salvate', auth: 'user' },
      { method: 'POST', path: '/api/user/insta-posts', summary: 'Salvează postare carousel', auth: 'user' },
      { method: 'GET', path: '/api/user/insta-posts/:id', summary: 'Detalii postare', auth: 'user' },
      { method: 'PUT', path: '/api/user/insta-posts/:id', summary: 'Actualizează postare', auth: 'user' },
      { method: 'DELETE', path: '/api/user/insta-posts/:id', summary: 'Șterge postare', auth: 'user' },
    ],
  },
  {
    id: 'write',
    title: 'Write workspace',
    routes: [
      { method: 'GET', path: '/api/words', summary: 'Căutare lexicon românesc (rime, silabe)', auth: 'public' },
      { method: 'GET', path: '/api/word-definition', summary: 'Definiție cuvânt (cache + surse externe)', auth: 'public' },
    ],
  },
  {
    id: 'carousel',
    title: 'Carousel',
    routes: [
      { method: 'GET', path: '/api/carousel/defaults', summary: 'Setări implicite carousel (site)', auth: 'public' },
      { method: 'PUT', path: '/api/carousel/defaults', summary: 'Actualizează defaults site', auth: 'admin' },
    ],
  },
  {
    id: 'site',
    title: 'Site settings',
    routes: [
      { method: 'GET', path: '/api/site/settings', summary: 'Setări publice site', auth: 'public' },
      { method: 'PUT', path: '/api/site/settings', summary: 'Actualizează setări', auth: 'admin' },
    ],
  },
  {
    id: 'admin',
    title: 'Admin & import',
    routes: [
      { method: 'GET', path: '/api/admin/users', summary: 'Listă utilizatori', auth: 'admin' },
      { method: 'PATCH', path: '/api/admin/users/:id/role', summary: 'Schimbă rol utilizator', auth: 'admin' },
      { method: 'DELETE', path: '/api/admin/users/:id', summary: 'Șterge utilizator', auth: 'admin' },
      { method: 'POST', path: '/api/admin/enrich-poems', summary: 'Enrichment date poezii (AI)', auth: 'admin' },
      { method: 'POST', path: '/api/import/poetrydb', summary: 'Import PoetryDB', auth: 'admin' },
      { method: 'POST', path: '/api/import/romanian', summary: 'Import corpus românesc', auth: 'admin' },
      { method: 'POST', path: '/api/import/bulk', summary: 'Import bulk CSV/JSON', auth: 'admin' },
    ],
  },
]
