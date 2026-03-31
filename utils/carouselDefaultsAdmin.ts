/**
 * Default owner email for saving site-wide Instagram carousel settings.
 * Keep in sync with `nuxt.config` `runtimeConfig.public.carouselDefaultsAdminEmail`.
 */
export const CAROUSEL_DEFAULTS_ADMIN_EMAIL = 'vasileeduardbogdan@gmail.com'

export function resolveCarouselDefaultsAdminEmail(fromRuntime?: string | null): string {
  const s = String(fromRuntime ?? '').trim().toLowerCase()
  return s || CAROUSEL_DEFAULTS_ADMIN_EMAIL
}
