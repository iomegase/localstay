import type { Metadata } from 'next'
import { SITE } from '@/features/seo/lib/site'
import type { LocalSeoIntent } from '../content/destinations'
import type { PublicLocalLandingDto } from '../types/landing-pages'
import { localSeoPath } from './paths'

export function localSeoMetadata(
  landing: PublicLocalLandingDto,
  intent: LocalSeoIntent,
): Metadata {
  const title = landing.page.seo_title
  const description = landing.page.meta_description
  const path = localSeoPath(intent, landing.city.slug)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: SITE.locale,
      siteName: SITE.name,
      title,
      description,
      url: path,
      images: ['/og-mystay.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-mystay.png'],
    },
  }
}
