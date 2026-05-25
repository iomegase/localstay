import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { restoreAdminPoi } from '@/features/admin-pois/queries/admin-pois'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await context.params
    const data = await restoreAdminPoi(id, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
