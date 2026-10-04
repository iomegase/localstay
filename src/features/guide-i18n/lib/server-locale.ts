import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, resolveGuideLocale, type GuideLocale } from './locale'
import { guideMessages, type GuideMessages } from '../messages'

/** Spec 061 AC-01-03 / AC-01-04 ; hors requête (rendu statique, tests), français. */
export async function getGuideLocale(): Promise<GuideLocale> {
  try {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
    return resolveGuideLocale({
      cookie: cookieStore.get(LOCALE_COOKIE)?.value,
      acceptLanguage: headerStore.get('accept-language'),
    })
  } catch {
    return 'fr'
  }
}

export async function getGuideMessages(): Promise<GuideMessages> {
  return guideMessages(await getGuideLocale())
}
