import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { listAdminLodgingProfiles } from '@/features/lodging-showcase/queries/admin-public-profiles'

const QuerySchema = z.object({
  publication_status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  city_id: z.string().optional(),
  owner_id: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error

  const query = QuerySchema.safeParse({
    publication_status: req.nextUrl.searchParams.get('publication_status') ?? undefined,
    city_id: req.nextUrl.searchParams.get('city_id') ?? undefined,
    owner_id: req.nextUrl.searchParams.get('owner_id') ?? undefined,
  })

  if (!query.success) {
    return apiError('VALIDATION_ERROR', 'Parametre invalide', 400, query.error.flatten())
  }

  const rows = await listAdminLodgingProfiles(query.data)
  return NextResponse.json(rows)
}
