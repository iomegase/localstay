export class FallbackImageError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'CATEGORY_NOT_FOUND' | 'SUBCATEGORY_CATEGORY_MISMATCH',
    public readonly status: number,
  ) {
    super(code)
  }
}

export const FALLBACK_IMAGE_ERROR_MESSAGES: Record<FallbackImageError['code'], string> = {
  NOT_FOUND: 'Image introuvable',
  CATEGORY_NOT_FOUND: 'Catégorie introuvable',
  SUBCATEGORY_CATEGORY_MISMATCH: 'La sous-catégorie n’appartient pas à la catégorie choisie',
}
