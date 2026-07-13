<template>
  <article class="docs-prose mx-auto max-w-3xl">
    <slot />
  </article>
</template>

<style scoped>
.docs-prose :deep(h1) {
  @apply mb-2 font-serif text-display-sm font-semibold tracking-tight text-content;
}

.docs-prose :deep(h1 + p.lead) {
  @apply mb-10 text-base leading-relaxed text-content-secondary;
}

.docs-prose :deep(h2) {
  @apply mb-4 mt-12 scroll-mt-24 font-serif text-xl font-semibold tracking-tight text-content first:mt-0;
}

.docs-prose :deep(h3) {
  @apply mb-3 mt-8 font-sans text-sm font-semibold uppercase tracking-wide text-content-muted;
}

.docs-prose :deep(p) {
  @apply mb-4 text-sm leading-relaxed text-content-secondary;
}

.docs-prose :deep(ul),
.docs-prose :deep(ol) {
  @apply mb-4 space-y-2 pl-5 text-sm text-content-secondary;
}

.docs-prose :deep(ul) {
  @apply list-disc;
}

.docs-prose :deep(ol) {
  @apply list-decimal;
}

.docs-prose :deep(li) {
  @apply leading-relaxed;
}

.docs-prose :deep(code) {
  @apply rounded-ds-sm bg-surface-subtle px-1.5 py-0.5 font-mono text-xs text-content;
}

.docs-prose :deep(pre) {
  @apply mb-4 overflow-x-auto rounded-ds-lg border border-edge-subtle bg-surface-subtle p-4;
}

.docs-prose :deep(pre code) {
  @apply bg-transparent p-0 text-xs leading-relaxed;
}

.docs-prose :deep(a) {
  @apply ds-link font-medium;
}

.docs-prose :deep(table) {
  @apply mb-6 w-full border-collapse text-left text-sm;
}

.docs-prose :deep(th) {
  @apply border-b border-edge-subtle px-3 py-2 font-semibold text-content;
}

.docs-prose :deep(td) {
  @apply border-b border-edge-subtle px-3 py-2 text-content-secondary;
}

.docs-prose :deep(.docs-card-grid) {
  @apply mb-8 grid gap-4 sm:grid-cols-2;
}

.docs-prose :deep(.docs-card) {
  @apply rounded-ds-lg border border-edge-subtle bg-surface-raised p-4 shadow-ds-card transition hover:border-edge hover:shadow-ds-card-hover;
}

.docs-prose :deep(.docs-card h3) {
  @apply mb-1 mt-0 font-serif text-base font-semibold normal-case tracking-normal text-content;
}

.docs-prose :deep(.docs-card p) {
  @apply mb-0 text-xs text-content-muted;
}

.docs-prose :deep(.docs-eyebrow) {
  @apply ds-eyebrow mb-3 block;
}
</style>
