import { SITE_OWNER_EMAIL } from './roles'

/**
 * Default owner email for saving site-wide Instagram carousel settings.
 * Keep in sync with `nuxt.config` `runtimeConfig.public.carouselDefaultsAdminEmail`.
 */
export const CAROUSEL_DEFAULTS_ADMIN_EMAIL = SITE_OWNER_EMAIL

export function resolveCarouselDefaultsAdminEmail(fromRuntime?: string | null): string {
  const s = String(fromRuntime ?? '').trim().toLowerCase()
  return s || CAROUSEL_DEFAULTS_ADMIN_EMAIL
}

/** Only this account may change the site-wide last-slide (CTA) message. */
export function isCarouselSiteOwnerEmail(email: string, fromRuntime?: string | null): boolean {
  return email.trim().toLowerCase() === resolveCarouselDefaultsAdminEmail(fromRuntime).toLowerCase()
}

/** Carousel poem tools + site defaults: staff (`admin`/`moderator`), or the configured owner email. */
export function userCanManageCarouselDefaults(
  user: { email: string; role?: string },
  runtimeEmail?: string | null,
): boolean {
  if (user.role === 'admin' || user.role === 'moderator') return true
  const adminEmail = resolveCarouselDefaultsAdminEmail(runtimeEmail)
  return user.email.toLowerCase() === adminEmail
}
