import type { Metadata } from 'next'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import { getDiscoveryIndex } from '@/features/public-discovery/queries/public-discovery'
import { homeMetadata } from '@/features/seo/lib/metadata'

export const metadata: Metadata = homeMetadata()

export default async function HomePage() {
  return await AnonymousLanding()
}

async function AnonymousLanding() {
  const [lodgings, discoveryCities] = await Promise.all([
    listPublishedLodgings({ limit: 2 }),
    getDiscoveryIndex(),
  ])
  const territoryCities = discoveryCities.map(city => ({ slug: city.slug, name: city.name }))
  return <MarketingHome lodgings={lodgings} territoryCities={territoryCities} />
}
