import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/features/merchant/lib/responses'
import { FALLBACK_IMAGE_ERROR_MESSAGES, FallbackImageError } from './errors'

export const MAX_FILES_PER_UPLOAD = 30

export const FallbackImageListQuerySchema = z.union([
  z.object({ filter: z.literal('unclassified') }).strict(),
  z.object({
    category_id: z.string().uuid().optional(),
    subcategory_id: z.string().uuid().optional(),
  }).strict(),
])

export const FallbackImageClassifySchema = z.object({
  image_ids: z.array(z.string().uuid()).min(1).max(200),
  category_id: z.string().uuid().nullable(),
  subcategory_id: z.string().uuid().nullable().optional(),
}).strict()

export function responseFromFallbackImageError(error: unknown): NextResponse {
  if (error instanceof FallbackImageError) {
    return apiError(error.code, FALLBACK_IMAGE_ERROR_MESSAGES[error.code], error.status)
  }
  console.error('[fallback-images]', error)
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}
