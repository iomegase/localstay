/** Spec 061 : langues du guide privé (français source, anglais). */
export const GUIDE_LOCALES = ['fr', 'en'] as const
export type GuideLocale = (typeof GUIDE_LOCALES)[number]

/** Cookie de préférence de langue de la spec 027 (AC-01-01), sans donnée personnelle. */
export const LOCALE_COOKIE = 'staylocal_locale'
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60

export function isGuideLocale(value: unknown): value is GuideLocale {
  return typeof value === 'string' && (GUIDE_LOCALES as readonly string[]).includes(value)
}

/** AC-01-03 : cookie valide, sinon langue préférée du téléphone ; sans en-tête, français. */
export function resolveGuideLocale({
  cookie,
  acceptLanguage,
}: {
  cookie: string | undefined
  acceptLanguage: string | null
}): GuideLocale {
  if (isGuideLocale(cookie)) return cookie
  const preferred = acceptLanguage?.split(',')[0]?.trim().toLowerCase()
  if (!preferred) return 'fr'
  return preferred.startsWith('fr') ? 'fr' : 'en'
}

export const INTL_LOCALE: Record<GuideLocale, string> = { fr: 'fr-FR', en: 'en-GB' }
