import { createSupabaseServer } from '@/shared/lib/supabase'

const BUCKET = 'qr-codes'

export async function uploadQrToStorage(
  citySlug: string,
  buffer: Buffer,
): Promise<string> {
  const supabase = createSupabaseServer()
  const path = `${citySlug}.png`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
