/**
 * Default owner email for saving site-wide Instagram carousel settings.
 * Keep in sync with `nuxt.config` `runtimeConfig.public.carouselDefaultsAdminEmail`.
 */
export const CAROUSEL_DEFAULTS_ADMIN_EMAIL = 'vasileeduardbogdan@gmail.com'

export function resolveCarouselDefaultsAdminEmail(fromRuntime?: string | null): string {
  const s = String(fromRuntime ?? '').trim().toLowerCase()
  return s || CAROUSEL_DEFAULTS_ADMIN_EMAIL
}

/** Carousel poem tools + site defaults: any `User` with role admin, or the configured owner email. */
export function userCanManageCarouselDefaults(
  user: { email: string; role?: string },
  runtimeEmail?: string | null,
): boolean {
  if (user.role === 'admin') return true
  const adminEmail = resolveCarouselDefaultsAdminEmail(runtimeEmail)
  return user.email.toLowerCase() === adminEmail
}
