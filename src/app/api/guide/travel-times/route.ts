import { NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { getCachedTravelTimes } from '@/features/transport/travel-times'

const headers = { 'Cache-Control': 'private, max-age=3600' }

/**
 * Temps de trajet depuis le logement de la session vers ses coups de cœur
 * (spec 057). Les coordonnées du logement ne viennent jamais du client.
 */
export async function GET(): Promise<NextResponse> {
  const context = await getActiveLodgingContext()
  if (!context) return apiError('UNAUTHORIZED', 'Aucun séjour actif', 401)

  const guide = await getPrivateGuideData(context.lodgingId)
  if (!guide) return apiError('UNAUTHORIZED', 'Aucun séjour actif', 401)
  if (!guide.lodging.locationPrecise || guide.pois.length === 0) {
    return NextResponse.json({ status: 'outside_coverage', data: {} }, { headers })
  }

  try {
    const data = await getCachedTravelTimes(
      { latitude: guide.lodging.latitude, longitude: guide.lodging.longitude },
      guide.pois.map(poi => ({ id: poi.id, latitude: poi.latitude, longitude: poi.longitude })),
    )
    return NextResponse.json({ status: 'available', data }, { headers })
  } catch (error) {
    console.error('[guide/travel-times] unavailable', { reason: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json({ status: 'unavailable', data: {} }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
