import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  const data = await getAcquisitionRun(id)
  if (!data) return apiError('NOT_FOUND', 'Ressource introuvable', 404)

  return NextResponse.json({ data })
}
