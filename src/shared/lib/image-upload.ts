/** Limite de taille d'upload image (owner/admin) : 5 Mo. */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

/** Extensions/MIME acceptés à l'upload, exposés au <input accept>. */
export const ACCEPTED_IMAGE_UPLOAD_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
] as const

export interface UploadFormat {
  /** true → réencoder en webp (sharp) avant stockage. */
  convert: true
  contentType: 'image/webp'
  extension: 'webp'
}

/**
 * Résout le format de stockage pour un type MIME d'image.
 * png / jpeg / jpg / webp / avif → réencodé en webp (spec 012 BR-26 : l'optimiseur
 * Vercel ne redimensionne pas les sources AVIF) ; tout autre type → null (refusé).
 */
export function resolveUploadFormat(mimeType: string): UploadFormat | null {
  switch (mimeType) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/webp':
    case 'image/avif':
      return { convert: true, contentType: 'image/webp', extension: 'webp' }
    default:
      return null
  }
}
