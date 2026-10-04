import type { GuideLocale } from '../lib/locale'
import { fr } from './fr'
import { en } from './en'

/** Même forme que le dictionnaire français, chaînes ou fonctions de formatage. */
type DeepMessages<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => string
      ? (...args: A) => string
      : DeepMessages<T[K]>
}

export type GuideMessages = DeepMessages<typeof fr>

const MESSAGES: Record<GuideLocale, GuideMessages> = { fr, en }

export function guideMessages(locale: GuideLocale): GuideMessages {
  return MESSAGES[locale]
}
