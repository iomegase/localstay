import type { Metadata } from 'next'
import { truncate } from '@/features/seo/lib/metadata'
import { SITE } from '@/features/seo/lib/site'
import type { LocalSeoDestination, LocalSeoIntent } from '../content/destinations'
import { localSeoPath } from './paths'

function contentForIntent(destination: LocalSeoDestination, intent: LocalSeoIntent) {
  if (intent === 'vacation-rental') return destination.services.vacationRental
  return destination.services[intent]
}

function titleForIntent(destination: LocalSeoDestination, intent: LocalSeoIntent): string {
  if (intent === 'concierge') return `Conciergerie à ${destination.name}`
  if (intent === 'seminar') return `Séminaire à ${destination.name}`
  return `Locations de vacances à ${destination.name}`
}

export function localSeoMetadata(
  destination: LocalSeoDestination,
  intent: LocalSeoIntent,
  indexable: boolean,
): Metadata {
  const title = titleForIntent(destination, intent)
  const brandedTitle = `${title} | MyStay`
  const description = truncate(contentForIntent(destination, intent).metaDescription)
  const path = localSeoPath(intent, destination.slug)

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: indexable, follow: indexable || intent === 'vacation-rental' },
    openGraph: {
      type: 'website',
      locale: SITE.locale,
      siteName: SITE.name,
      title: brandedTitle,
      description,
      url: path,
      images: ['/og-mystay.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: ['/og-mystay.png'],
    },
  }
}
