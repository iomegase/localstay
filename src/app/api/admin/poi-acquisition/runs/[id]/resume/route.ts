import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { resumeAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

// Spec 072 US-02 : reprendre un lancement partiel (budget de traitement 240 s).
export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await params
    return NextResponse.json({ data: await resumeAcquisitionRun(id) })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
