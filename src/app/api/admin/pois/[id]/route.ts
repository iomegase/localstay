import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { parsedOrValidationError, readJson, responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import {
  containsTrailLockedFields,
  parseAdminPoiPatchInput,
} from '@/features/admin-pois/lib/admin-poi-rules'
import { getAdminPoi, updateAdminPoi } from '@/features/admin-pois/queries/admin-pois'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const data = await getAdminPoi(id)
  if (!data) return apiError('POI_NOT_FOUND', 'POI introuvable', 404)

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  if (containsTrailLockedFields(body)) {
    return apiError('TRAIL_FIELDS_LOCKED', 'Données randonnée verrouillées dans ce backoffice', 409)
  }

  const parsed = parsedOrValidationError(parseAdminPoiPatchInput(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await context.params
    const result = await updateAdminPoi(id, parsed, session.user.id)
    safelyRevalidateDiscoveryPaths(result.discovery_revalidation_paths)
    return NextResponse.json({ data: result.data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
