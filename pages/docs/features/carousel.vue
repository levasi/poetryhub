<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useHead({ title: 'Carousel Instagram — Documentație PoetryHub' })
</script>

<template>
  <DocsProse>
    <span class="docs-eyebrow">Features</span>
    <h1>Carousel Instagram</h1>
    <p class="lead">
      Generator de slide-uri Instagram din poezii — export imagine, teme tipografice, CTA brand.
    </p>

    <h2>Pagini</h2>
    <ul>
      <li><code>/carousel-generator</code> — editor public (selectează poezie, personalizează, export)</li>
      <li><code>/admin/insta-post</code> — preview/admin defaults site</li>
      <li><code>/account/insta-posts</code> — postări salvate de utilizator</li>
    </ul>

    <h2>Funcționalități</h2>
    <ul>
      <li>Șabloane slide (<code>CarouselInstaTemplate</code>, <code>CarouselSlideBrand</code>, CTA)</li>
      <li>Selectare font, greutate, layout versuri — <code>useCarouselGenerator</code></li>
      <li>Defaults site în <code>CarouselSiteDefaults</code>; override per poezie în <code>carouselFontSettings</code></li>
      <li>Export PNG via <code>html2canvas</code>; arhivă ZIP cu <code>jszip</code></li>
      <li>Salvare postări — <code>UserInstaPost</code> (payload JSON)</li>
    </ul>

    <h2>API</h2>
    <ul>
      <li><code>GET /api/carousel/defaults</code> — config public</li>
      <li><code>PUT /api/carousel/defaults</code> — admin carousel defaults</li>
      <li><code>/api/user/insta-posts/*</code> — CRUD postări user</li>
    </ul>

    <h2>Testare</h2>
    <ul>
      <li><code>tests/unit/composables/useCarouselGenerator.test.ts</code></li>
      <li><code>tests/unit/utils/carousel*.test.ts</code> — defaults, font weights, written-in</li>
      <li><code>tests/api/carousel.defaults.get.test.ts</code></li>
    </ul>
  </DocsProse>
</template>
