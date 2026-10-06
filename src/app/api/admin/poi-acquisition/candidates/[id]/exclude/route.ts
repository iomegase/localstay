import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { excludeCandidate } from '@/features/poi-acquisition/queries/review'

// Spec 071 US-03 : exclure un lieu de toutes les acquisitions de la ville.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await params
    return NextResponse.json({ data: await excludeCandidate(id, session.user.id) })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
