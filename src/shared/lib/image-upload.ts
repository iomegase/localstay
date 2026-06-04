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
  /** true → convertir en webp (sharp) avant stockage. */
  convert: boolean
  contentType: 'image/webp' | 'image/avif'
  extension: 'webp' | 'avif'
}

/**
 * Résout le format de stockage pour un type MIME d'image.
 * png / jpeg / jpg → converti en webp ; webp & avif conservés tels quels ;
 * tout autre type → null (refusé).
 */
export function resolveUploadFormat(mimeType: string): UploadFormat | null {
  switch (mimeType) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
      return { convert: true, contentType: 'image/webp', extension: 'webp' }
    case 'image/webp':
      return { convert: false, contentType: 'image/webp', extension: 'webp' }
    case 'image/avif':
      return { convert: false, contentType: 'image/avif', extension: 'avif' }
    default:
      return null
  }
}
