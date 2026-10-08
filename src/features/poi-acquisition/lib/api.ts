import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { messageForPoiAcquisitionCode, PoiAcquisitionError } from './errors'
import { ADMIN_DESCRIPTION_MAX_CHARS, ADMIN_DESCRIPTION_TOO_LONG } from '@/shared/lib/description-length'
import { PhoneSchema } from '@/shared/lib/phone'

export const AcquisitionRunCreateSchema = z.object({
  city_id: z.string().min(1),
  category_id: z.string().min(1),
  source_url: z.string().url().nullable().optional(),
  // Spec 066 US-04 : run à candidat unique.
  google_place_id: z.string().min(1).max(255).optional(),
})

// Spec 066 AC-04-01.
export const AcquisitionNameSearchSchema = z.object({
  city_id: z.string().min(1),
  query: z.string().trim().min(2).max(120),
})

export const ReviewPublishSchema = z.object({
  confirm_duplicate: z.boolean().default(false),
})

export const ReviewMergeSchema = z.object({
  poi_id: z.string().min(1),
})

// Spec 071 US-01 : modification d'un candidat avant publication.
export const CandidateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  address: z.string().trim().min(5).max(255).optional(),
  phone: PhoneSchema.nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
  description: z.string().trim().max(ADMIN_DESCRIPTION_MAX_CHARS, ADMIN_DESCRIPTION_TOO_LONG).nullable().optional(),
  category_id: z.string().uuid().optional(),
  subcategory_id: z.string().uuid().nullable().optional(),
}).strict()

export const ReviewRejectSchema = z.object({
  admin_note: z.string().max(500).optional(),
})

export const ManualPoiCreateSchema = z.object({
  name: z.string().min(1).max(160),
  address: z.string().min(5).max(255),
  city_id: z.string().min(1),
  category_id: z.string().min(1),
  subcategory_id: z.string().min(1).nullable().optional(),
  phone: PhoneSchema.nullable().optional(),
  website: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  confirm_duplicate: z.boolean().default(false),
  confirm_geocode_pending_review: z.boolean().default(false),
})

export const ManualPoiSourceUrlSchema = z.object({
  source_url: z.string().url(),
})

export const MissingPoiCreateSchema = z.object({
  name: z.string().min(1).max(160),
  address: z.string().min(5).max(255),
  phone: PhoneSchema.nullable().optional(),
  website: z.string().url().nullable().optional(),
  city_id: z.string().min(1),
  category_id: z.string().min(1).nullable().optional(),
})

export async function readJson(req: NextRequest): Promise<unknown | NextResponse> {
  try {
    return await req.json()
  } catch {
    return validationError({})
  }
}

export function parsedOrValidationError<T>(result: z.SafeParseReturnType<unknown, T>): T | NextResponse {
  if (!result.success) return validationError(result.error.flatten())
  return result.data
}

export function responseFromPoiAcquisitionError(error: unknown): NextResponse {
  if (error instanceof PoiAcquisitionError || isPoiAcquisitionErrorLike(error)) {
    const codeValue = Reflect.get(error, 'code')
    const code = typeof codeValue === 'string' ? codeValue : error.message
    const details = Reflect.get(error, 'details')
    return apiError(
      code,
      messageForPoiAcquisitionCode(code),
      error.status,
      isRecord(details) ? details : {},
    )
  }
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}

function isPoiAcquisitionErrorLike(error: unknown): error is Error & { status: number } {
  if (!(error instanceof Error)) return false
  return typeof Reflect.get(error, 'status') === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
