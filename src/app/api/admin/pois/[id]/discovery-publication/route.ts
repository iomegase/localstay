import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { parsedOrValidationError, readJson, responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { updatePoiDiscoveryPublication } from '@/features/public-discovery/queries/admin-publication'

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
    for (const path of invalidationPaths) revalidatePath(path, 'page')
    revalidatePath('/sitemap.xml')

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
    return responseFromPoiAcquisitionError(error)
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
