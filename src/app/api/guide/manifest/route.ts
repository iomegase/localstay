import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/features/merchant/lib/responses'
import { buildLodgingManifest } from '@/features/guide-pwa/lib/manifest'
import { findManifestLodging } from '@/features/guide-pwa/queries/manifest-lodging'

const querySchema = z.object({ lodging: z.string().uuid() })

/**
 * Manifest du guide installé, propre à un logement (spec 059 AC-01-01).
 * L'identifiant est le même porteur d'accès que le QR code (BR-01).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = querySchema.safeParse({ lodging: request.nextUrl.searchParams.get('lodging') ?? undefined })
  if (!parsed.success) {
    return apiError('INVALID_LODGING', 'Identifiant de logement manquant ou invalide', 400, parsed.error.flatten())
  }

  const lodging = await findManifestLodging(parsed.data.lodging)
  if (!lodging) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  const manifest = buildLodgingManifest({ lodgingId: lodging.id, lodgingName: lodging.name })
  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
