// Spec 085 : préparation d'une photo dans le navigateur avant l'envoi
// (HEIC → JPEG, réduction ≤ 2560 px pour rester sous la limite de requête Vercel de 4,5 Mo).

/** Côté le plus long d'une photo envoyée (identique au stockage, 012 BR-26). */
export const CLIENT_MAX_IMAGE_SIDE = 2560
/** Au-delà, la photo est réencodée même si ses dimensions sont raisonnables. */
export const CLIENT_MAX_IMAGE_BYTES = 3.5 * 1024 * 1024
const JPEG_QUALITY = 0.85

export class ImagePreparationError extends Error {}

type Size = { width: number; height: number }

export type PrepareImageDeps = {
  convertHeic: (file: File) => Promise<Blob>
  decode: (file: File) => Promise<Size & { close?: () => void }>
  encode: (image: Size & { close?: () => void }, width: number, height: number) => Promise<Blob>
}

export function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export function needsClientResize(image: Size & { size: number }): boolean {
  return Math.max(image.width, image.height) > CLIENT_MAX_IMAGE_SIDE || image.size > CLIENT_MAX_IMAGE_BYTES
}

function renamed(name: string, extension: string): string {
  const base = name.replace(/\.[^./]+$/, '')
  return `${base || 'photo'}.${extension}`
}

const browserDeps: PrepareImageDeps = {
  async convertHeic(file) {
    // Chargée à la demande (BR-02) : bibliothèque lourde, utile seulement pour les HEIC.
    const { default: heic2any } = await import('heic2any')
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    return Array.isArray(result) ? result[0]! : result
  },
  decode: file => createImageBitmap(file),
  async encode(image, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new ImagePreparationError('Impossible de préparer cette photo.')
    context.drawImage(image as unknown as CanvasImageSource, 0, 0, width, height)
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new ImagePreparationError('Impossible de préparer cette photo.'))), 'image/jpeg', JPEG_QUALITY)
    })
  },
}

/** Spec 085 AC-01 / AC-02 / AC-05 : renvoie un fichier prêt à être envoyé. */
export async function prepareImageForUpload(input: File, deps: PrepareImageDeps = browserDeps): Promise<File> {
  let file = input
  if (isHeicFile(file)) {
    try {
      const jpeg = await deps.convertHeic(file)
      file = new File([jpeg], renamed(file.name, 'jpg'), { type: 'image/jpeg' })
    } catch {
      throw new ImagePreparationError('Impossible de convertir cette photo HEIC. Exportez-la en JPEG puis réessayez.')
    }
  } else if (!file.type.startsWith('image/')) {
    throw new ImagePreparationError('Format non pris en charge (JPEG, PNG, WebP, AVIF ou HEIC).')
  }

  let image: Size & { close?: () => void }
  try {
    image = await deps.decode(file)
  } catch {
    // Format que le navigateur ne sait pas lire : le serveur tranchera.
    return file
  }

  try {
    if (!needsClientResize({ width: image.width, height: image.height, size: file.size })) return file
    const scale = Math.min(1, CLIENT_MAX_IMAGE_SIDE / Math.max(image.width, image.height))
    const width = Math.round(image.width * scale)
    const height = Math.round(image.height * scale)
    const blob = await deps.encode(image, width, height)
    return new File([blob], renamed(file.name, 'jpg'), { type: 'image/jpeg' })
  } finally {
    image.close?.()
  }
}

/** Message d'erreur lisible pour un envoi de photo (AC-05). */
export function uploadErrorMessage(status: number, serverMessage?: string): string {
  if (status === 413) return 'Photo trop lourde. Réessayez avec une photo plus légère.'
  return serverMessage ?? 'Téléversement impossible. Réessayez.'
}
