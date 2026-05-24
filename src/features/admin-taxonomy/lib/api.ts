import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { isValidLucideIconSlug } from './icons'
import { ApiTaxonomyError } from '../queries/taxonomy'

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugSchema,
  icon: z.string().min(1),
  sort_order: z.number().int(),
  is_active: z.boolean().default(true),
})

export const CategoryPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: slugSchema.optional(),
  icon: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
})

export const SubCategoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugSchema,
  sort_order: z.number().int(),
  is_active: z.boolean().default(true),
})

export const SubCategoryPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: slugSchema.optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
})

export async function readJson(req: NextRequest): Promise<unknown | NextResponse> {
  try {
    return await req.json()
  } catch {
    return apiError('VALIDATION_ERROR', 'Corps de requête invalide', 400)
  }
}

export function validateIconSlug(icon: string | undefined): NextResponse | null {
  if (icon !== undefined && !isValidLucideIconSlug(icon)) {
    return apiError('INVALID_ICON', 'Icône Lucide invalide', 400, { icon })
  }
  return null
}

export function responseFromTaxonomyError(error: unknown): NextResponse {
  if (error instanceof ApiTaxonomyError || isApiTaxonomyErrorLike(error)) {
    const codeValue = Reflect.get(error, 'code')
    const code = typeof codeValue === 'string' ? codeValue : error.message
    return apiError(code, messageForCode(code), error.status, error.details ?? {})
  }
  return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
}

export function parsedOrValidationError<T>(
  result: z.SafeParseReturnType<unknown, T>,
): T | NextResponse {
  if (!result.success) return validationError(result.error.flatten())
  return result.data
}

function messageForCode(code: string): string {
  if (code === 'NOT_FOUND') return 'Ressource introuvable'
  if (code === 'SLUG_ALREADY_EXISTS') return 'Slug déjà utilisé'
  if (code === 'SLUG_LOCKED') return 'Slug verrouillé'
  if (code === 'INVALID_ICON') return 'Icône Lucide invalide'
  return 'Erreur taxonomie'
}

function isApiTaxonomyErrorLike(error: unknown): error is Error & {
  status: number
  details?: Record<string, unknown>
} {
  if (!(error instanceof Error)) return false
  const status = Reflect.get(error, 'status')
  return typeof status === 'number'
}
