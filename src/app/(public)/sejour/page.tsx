import { PrivateGuidePage } from '@/features/guide-app/components/PrivateGuidePage'

type SejourPageProps = {
  searchParams?: Promise<{ lodging?: string; source?: string }>
}

export default async function SejourPage({
  searchParams,
}: SejourPageProps = {}) {
  const params = await searchParams
  // Spec 059 AC-01-02 : l'ouverture du guide installé n'est pas un scan QR.
  const lodgingFromQuery = params?.source === 'pwa' ? null : params?.lodging ?? null

  return PrivateGuidePage({ qrLodgingId: lodgingFromQuery })
}
