import sharp from 'sharp'
import { createSupabaseServer } from '@/shared/lib/supabase'
import { MAX_IMAGE_UPLOAD_BYTES, resolveUploadFormat } from '@/shared/lib/image-upload'

const BUCKET = 'guide-photos'

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; code: 'INVALID_TYPE' | 'TOO_LARGE' | 'UPLOAD_FAILED' }

/** Plus grand côté d'une image stockée (spec 012 BR-26). */
export const MAX_STORED_IMAGE_SIDE = 2560

/** Réencode une image en WebP q82, orientation EXIF appliquée, ≤ 2560 px, sans agrandissement. */
export function encodeStoredWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: MAX_STORED_IMAGE_SIDE, height: MAX_STORED_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

/**
 * Réencode l'image en WebP (tous formats acceptés, AVIF compris) puis la téléverse
 * dans le bucket `guide-photos` et renvoie son URL publique.
 */
export async function uploadGuideImage(file: File, pathPrefix: string): Promise<UploadImageResult> {
  const format = resolveUploadFormat(file.type)
  if (!format) return { ok: false, code: 'INVALID_TYPE' }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { ok: false, code: 'TOO_LARGE' }

  const input = Buffer.from(await file.arrayBuffer())
  const body = await encodeStoredWebp(input)

  const supabase = createSupabaseServer()
  const path = `${pathPrefix}/${Date.now()}.${format.extension}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: format.contentType,
    upsert: false,
  })

  if (error || !data) {
    console.error('[uploadGuideImage] Supabase Storage upload failed', error?.message)
    return { ok: false, code: 'UPLOAD_FAILED' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return { ok: true, url: publicUrl.publicUrl }
}
