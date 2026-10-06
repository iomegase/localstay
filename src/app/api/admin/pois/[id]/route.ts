import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { parsedOrValidationError, readJson, responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import {
  containsTrailLockedFields,
  parseAdminPoiPatchInput,
} from '@/features/admin-pois/lib/admin-poi-rules'
import { getAdminPoi, updateAdminPoi } from '@/features/admin-pois/queries/admin-pois'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'
import { refreshFallbackImagesSafely } from '@/features/fallback-images/services/reassign'
import { poiPhotoUrls } from '@/features/storage-cleanup/queries/references'
import { cleanupRemovedPoiPhotos } from '@/features/storage-cleanup/services/delete-files'
import { removedUrls } from '@/features/storage-cleanup/lib/storage-paths'

type RouteContext = {
  params: Promise<{ id: string }>
}

const PhotoListEchoSchema = z.object({ photos: z.array(z.string()).max(12) }).passthrough()

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

  try {
    const { id } = await context.params
    let input = parseAdminPoiPatchInput(body)
    // Older clients may echo an unchanged historical photo list containing a
    // now-rejected URL. Omit that no-op rather than blocking unrelated edits.
    if (!input.success && input.error.issues.every(issue => issue.path[0] === 'photos')) {
      const echo = PhotoListEchoSchema.safeParse(body)
      if (echo.success && z.string().uuid().safeParse(id).success) {
        const existing = await getAdminPoi(id)
        if (existing && echo.data.photos.length === existing.photos.length
          && echo.data.photos.every((photo, index) => photo === existing.photos[index])) {
          input = parseAdminPoiPatchInput(Object.fromEntries(
            Object.entries(echo.data).filter(([key]) => key !== 'photos'),
          ))
        }
      }
    }
    const parsed = parsedOrValidationError(input)
    if (parsed instanceof NextResponse) return parsed
    // Spec 070 AC-03-01 : photos avant enregistrement, pour supprimer celles retirées.
    const previousPhotos = await poiPhotoUrls(id)
    const result = await updateAdminPoi(id, parsed, session.user.id)
    await cleanupRemovedPoiPhotos(id, removedUrls(previousPhotos, result.data.photos))
    safelyRevalidateDiscoveryPaths(result.discovery_revalidation_paths)
    // Spec 070 AC-02-04 : image de remplacement recalculée (photos ou catégorie changées).
    await refreshFallbackImagesSafely([id])
    return NextResponse.json({ data: result.data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
