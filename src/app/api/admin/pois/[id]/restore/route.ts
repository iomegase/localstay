import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { restoreAdminPoi } from '@/features/admin-pois/queries/admin-pois'
import { revalidateAutoUnpublishedDiscovery } from '@/features/public-discovery/lib/revalidation'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await context.params
    const result = await restoreAdminPoi(id, session.user.id)
    revalidateAutoUnpublishedDiscovery(result.discovery_revalidation_paths)
    return NextResponse.json({ data: result.data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
