import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { updateTrailDetailFromGpx } from '@/features/admin-pois/queries/trail-detail-gpx'
import { GpxParseError } from '@/features/trails-acquisition/lib/gpx-parser'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const formData = await req.formData().catch(() => null)
  if (!formData) return apiError('VALIDATION_ERROR', 'Form-data requis avec un champ "gpx"', 400)
  const file = formData.get('gpx')
  if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Champ "gpx" manquant', 400)
  if (file.size > 5_000_000) return apiError('VALIDATION_ERROR', 'GPX trop volumineux (max 5 MB)', 400)

  try {
    const content = await file.text()
    const data = await updateTrailDetailFromGpx(id, session.user.id, { name: file.name, content })
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof GpxParseError) return apiError('VALIDATION_ERROR', error.message, 400)
    return responseFromPoiAcquisitionError(error)
  }
}
