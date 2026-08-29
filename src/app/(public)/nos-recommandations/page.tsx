import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { RecommendationsView } from './_components/RecommendationsView'

export const metadata: Metadata = privatePageMetadata('Nos recommandations — MyStay')

type NosRecommendationsPageProps = {
  searchParams?: Promise<{ lodging?: string }>
}

export default async function NosRecommendationsPage({
  searchParams,
}: NosRecommendationsPageProps = {}) {
  const lodgingFromQuery = (await searchParams)?.lodging ?? null
  void recordQrScanIfPresent(lodgingFromQuery)

  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  return await RecommendationsView({ lodgingContext })
}
