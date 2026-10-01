import { cache } from 'react'
import { localSeoPath } from '../lib/paths'
import { listPublishedLocalLandingSummaries } from './landing-pages'
import type { FooterLocalLandingLinks } from '../types/footer-links'


const EMPTY: FooterLocalLandingLinks = { vacationRental: [], concierge: [], seminar: [] }

/**
 * Liens du bloc « Nos destinations » du footer (spec 046 AC-04-06) : uniquement
 * les pages locales publiées, selon les mêmes règles que le sitemap. Une erreur
 * de lecture renvoie une liste vide pour ne jamais casser la page.
 */
export const getFooterLocalLandingLinks = cache(async (): Promise<FooterLocalLandingLinks> => {
  try {
    const summaries = await listPublishedLocalLandingSummaries()
    const link = (intent: Parameters<typeof localSeoPath>[0]) => (item: (typeof summaries)[number]) => ({
      name: item.city.name.replace(/\s+/g, ' ').trim(),
      href: localSeoPath(intent, item.city.slug),
    })
    return {
      vacationRental: summaries.filter(item => item.publication.vacationRental).map(link('vacation-rental')),
      concierge: summaries.filter(item => item.publication.concierge).map(link('concierge')),
      seminar: summaries.filter(item => item.publication.seminar).map(link('seminar')),
    }
  } catch (error) {
    console.error('[footer] local landing links unavailable:', error)
    return EMPTY
  }
})
