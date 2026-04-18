<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()

const supportEmail = 'vasileeduardbogdan@gmail.com'
const mailtoHref = computed(() => {
  const subject = encodeURIComponent('PoetryHub — raportare eroare / inconsistență')
  const body = encodeURIComponent(
    [
      'Salut!',
      '',
      'Am găsit o posibilă eroare / inconsistență în baza de date:',
      '- Link: ',
      '- Ce se vede: ',
      '- Ce ar trebui să fie: ',
      '',
      'Mulțumesc!',
    ].join('\n'),
  )
  return `mailto:${supportEmail}?subject=${subject}&body=${body}`
})
</script>

<template>
  <footer class="mt-auto w-full border-t border-edge-subtle bg-surface-subtle/40 py-12 md:py-14">
    <div class="mx-auto w-full max-w-content px-4 md:px-6">
      <div class="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start md:gap-12">
        <p
          class="max-w-reading text-balance text-center font-serif text-sm leading-relaxed italic text-content-secondary md:text-left"
        >
          {{ t('footer.quote') }}
        </p>
        <nav
          class="flex shrink-0 flex-wrap justify-center gap-x-8 gap-y-2 text-ui-sm font-medium text-content-soft"
          aria-label="Footer"
        >
          <NuxtLink to="/" class="ds-link hover:text-content-secondary">{{ t('home.navHome') }}</NuxtLink>
          <NuxtLink to="/admin" class="ds-link hover:text-content-secondary">{{ t('footer.admin') }}</NuxtLink>
          <a
            :href="mailtoHref"
            class="inline-flex items-center justify-center gap-2 rounded-ds-md border border-edge-subtle bg-surface-raised px-3 py-2 text-ui-sm font-semibold text-content-secondary shadow-sm transition hover:border-edge hover:bg-surface-page hover:text-content"
          >
            {{ t('footer.emailCta') }}
          </a>
        </nav>
      </div>
      <div
        class="mt-10 flex flex-col items-center gap-5 border-t border-edge-subtle pt-8 md:flex-row md:items-center md:justify-between"
      >
        <p class="text-center text-ui-xs text-content-hint md:text-left">{{ t('colorScheme.hint') }}</p>
        <ColorSchemeSwitch />
      </div>
      <p class="mt-6 text-center text-ui-xs text-content-hint">
        {{ t('footer.copyright', { year }) }}
      </p>
    </div>
  </footer>
</template>
