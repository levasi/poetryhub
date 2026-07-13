<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()
const { showLanguageSwitch } = useSiteSettings()

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
  <footer class="mt-auto w-full border-t border-edge-subtle bg-surface-subtle/40 py-12 md:py-16">
    <div class="mx-auto w-full max-w-none px-4 md:px-8 lg:px-10">
      <div class="flex flex-col items-center gap-8 text-center md:gap-10">
        <DsFleuron width="6rem" />
        <p class="max-w-reading text-balance font-serif text-sm leading-relaxed italic text-content-secondary">
          „Nu credeam să-nvăț a muri vreodată.”
          <span class="mt-3 block not-italic text-ui-xs font-semibold tracking-wide text-content-soft">
            — Mihai Eminescu
          </span>
        </p>

        <nav
          class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-ui-sm font-medium text-content-soft"
          aria-label="Footer"
        >
          <NuxtLink
            to="/descopera"
            class="ds-link hover:text-content-secondary"
          >
            {{ t('nav.discover') }}
          </NuxtLink>
          <NuxtLink
            to="/write"
            class="ds-link hover:text-content-secondary"
          >
            {{ t('nav.write') }}
          </NuxtLink>
          <NuxtLink
            to="/docs"
            class="ds-link hover:text-content-secondary"
          >
            {{ t('footer.docs') }}
          </NuxtLink>
          <a
            :href="mailtoHref"
            class="inline-flex items-center justify-center gap-2 rounded-ds-md border border-edge-subtle bg-surface-raised px-3 py-2 text-ui-sm font-semibold text-content-secondary shadow-sm transition hover:border-edge hover:bg-surface-page hover:text-content"
          >
            {{ t('footer.emailCta') }}
          </a>
          <LanguageSwitch v-if="showLanguageSwitch" />
        </nav>
      </div>

      <p class="mt-10 text-center text-ui-xs text-content-hint">
        {{ t('footer.copyright', { year }) }}
      </p>
    </div>
  </footer>
</template>
