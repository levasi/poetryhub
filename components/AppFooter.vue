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
  <footer class="app-footer">
    <div class="app-footer__inner">
      <div class="app-footer__body">
        <DsFleuron width="6rem" />
        <p class="app-footer__quote">
          „Nu credeam să-nvăț a muri vreodată.”
          <span class="app-footer__attribution">
            — Mihai Eminescu
          </span>
        </p>

        <nav
          class="app-footer__nav"
          aria-label="Footer"
        >
          <NuxtLink
            to="/descopera"
            class="ds-link app-footer__link"
          >
            {{ t('nav.discover') }}
          </NuxtLink>
          <NuxtLink
            to="/write"
            class="ds-link app-footer__link"
          >
            {{ t('nav.write') }}
          </NuxtLink>
          <a
            :href="mailtoHref"
            class="app-footer__email"
          >
            {{ t('footer.emailCta') }}
          </a>
          <LanguageSwitch v-if="showLanguageSwitch" />
        </nav>
      </div>

      <p class="app-footer__copy">
        {{ t('footer.copyright', { year }) }}
      </p>
    </div>
  </footer>
</template>
