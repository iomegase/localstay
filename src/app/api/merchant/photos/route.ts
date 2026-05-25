import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { createSupabaseServer } from '@/shared/lib/supabase'
import {
  appendMerchantPoiPhoto,
  assertMerchantCanAppendPhoto,
  MerchantDashboardError,
} from '@/features/merchant/queries/dashboard'

const BUCKET = 'merchant-poi-photos'
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024

function extensionFor(file: File): string {
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  return 'webp'
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return validationError({ file: 'required' })
  }

  if (!ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    return validationError({ file: 'invalid_type_or_size' })
  }

  try {
    await assertMerchantCanAppendPhoto(session.user.id)

    const supabase = createSupabaseServer()
    const timestamp = Date.now()
    const path = `${session.user.id}/${timestamp}.${extensionFor(file)}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[MerchantPhotos] Supabase Storage upload failed', {
        bucket: BUCKET,
        statusCode: uploadError.statusCode,
        message: uploadError.message,
      })
      return apiError('PHOTO_UPLOAD_FAILED', 'Upload photo impossible', 500)
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
    const data = await appendMerchantPoiPhoto(session.user.id, publicUrlData.publicUrl)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof MerchantDashboardError) {
      if (error.code === 'PHOTO_LIMIT_REACHED') {
        return apiError('PHOTO_LIMIT_REACHED', 'Limite de 5 photos atteinte', 409)
      }
      if (error.code === 'MERCHANT_PROFILE_NOT_ACTIVE') {
        return apiError('FORBIDDEN', 'Profil commerçant inactif ou introuvable', 403)
      }
    }
    throw error
  }
}
