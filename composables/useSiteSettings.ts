export interface SiteSettingsPayload {
  showLanguageSwitch: boolean
}

/**
 * Public site flags from GET /api/site/settings (singleton).
 * Language switch is off by default; it appears only when the API returns showLanguageSwitch: true.
 */
export function useSiteSettings() {
  const { data, refresh } = useFetch<SiteSettingsPayload>('/api/site/settings', {
    key: 'site-settings',
    default: () => ({ showLanguageSwitch: false }),
  })

  const showLanguageSwitch = computed(() => data.value?.showLanguageSwitch === true)

  return { data, showLanguageSwitch, refresh }
}
