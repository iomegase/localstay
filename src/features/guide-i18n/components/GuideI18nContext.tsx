'use client'

import { createContext, useContext } from 'react'
import { INTL_LOCALE, type GuideLocale } from '../lib/locale'
import { guideMessages, type GuideMessages } from '../messages'

export type GuideI18n = {
  locale: GuideLocale
  intlLocale: string
  messages: GuideMessages
  setLocale: (locale: GuideLocale) => void
}

// Hors guide privé (démo, site public, tests) : français, sans changement possible.
// Ce module n'a aucune dépendance réseau ni de navigation (isolation de la démo, 045).
const FALLBACK: GuideI18n = {
  locale: 'fr',
  intlLocale: INTL_LOCALE.fr,
  messages: guideMessages('fr'),
  setLocale: () => undefined,
}

export const GuideI18nContext = createContext<GuideI18n>(FALLBACK)

export function useGuideI18n(): GuideI18n {
  return useContext(GuideI18nContext)
}

export function useGuideMessages(): GuideMessages {
  return useContext(GuideI18nContext).messages
}
