import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { getTrailImportRun } from '@/features/trails-acquisition/queries/runs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const data = await getTrailImportRun(id)
  if (!data) return apiError('NOT_FOUND', 'Ressource introuvable', 404)

  return NextResponse.json({ data })
}
