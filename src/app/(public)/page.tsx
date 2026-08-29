import type { Metadata } from 'next'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import { homeMetadata } from '@/features/seo/lib/metadata'

export const metadata: Metadata = homeMetadata()

export default async function HomePage() {
  return await AnonymousLanding()
}

async function AnonymousLanding() {
  const lodgings = await listPublishedLodgings({ limit: 2 })
  return <MarketingHome lodgings={lodgings} />
}
