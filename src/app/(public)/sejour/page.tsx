import { PrivateGuidePage } from '@/features/guide-app/components/PrivateGuidePage'

type SejourPageProps = {
  searchParams?: Promise<{ lodging?: string }>
}

export default async function SejourPage({
  searchParams,
}: SejourPageProps = {}) {
  const lodgingFromQuery = (await searchParams)?.lodging ?? null

  return PrivateGuidePage({ qrLodgingId: lodgingFromQuery })
}
