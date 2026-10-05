import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { parsedOrValidationError, readJson, responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { updatePoiDiscoveryPublication } from '@/features/public-discovery/queries/admin-publication'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'
import { apiError } from '@/features/merchant/lib/responses'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'
import { mirrorPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'

const PoiDiscoveryPublicationPatchSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']),
}).strict()

const PoiIdSchema = z.string().uuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(PoiDiscoveryPublicationPatchSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const params = parsedOrValidationError(PoiIdSchema.safeParse((await context.params).id))
  if (params instanceof NextResponse) return params

  try {
    const result = await updatePoiDiscoveryPublication(params, parsed.status, session.user.id)
    const invalidationPaths = result.invalidation_paths ?? pathsFromPublicUrl(result.public_url)
    safelyRevalidateDiscoveryPaths(invalidationPaths)

    // Spec 063 AC-01-01 : copie des photos en arrière-plan, sans retarder la réponse.
    // La programmation elle-même ne doit jamais faire échouer la publication.
    if (result.discovery_status === 'PUBLISHED') {
      try {
        after(async () => {
          try {
            await mirrorPoiPhotos(result.id)
          } catch (error) {
            console.error('POI_PHOTO_MIRROR_FAILED', { poiId: result.id, error })
          }
        })
      } catch (error) {
        console.error('POI_PHOTO_MIRROR_SCHEDULE_FAILED', { poiId: result.id, error })
      }
    }

    return NextResponse.json({
      data: {
        id: result.id,
        discovery_status: result.discovery_status,
        discovery_published_at: result.discovery_published_at,
        public_url: result.public_url,
        eligibility: result.eligibility,
      },
    })
  } catch (error) {
    if (error instanceof PoiAcquisitionError) return responseFromPoiAcquisitionError(error)
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}

function pathsFromPublicUrl(publicUrl: string | null): string[] {
  if (!publicUrl) return []
  const parts = publicUrl.split('/').filter(Boolean)
  if (parts.length !== 4 || parts[0] !== 'decouvrir') return [publicUrl]
  return [
    `/decouvrir/${parts[1]}`,
    `/decouvrir/${parts[1]}/${parts[2]}`,
    publicUrl,
  ]
}
