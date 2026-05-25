import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { messageForTrailsAcquisitionCode, TrailsAcquisitionError } from './errors'

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

export function responseFromTrailsAcquisitionError(error: unknown): NextResponse {
  if (error instanceof TrailsAcquisitionError || isTrailsAcquisitionErrorLike(error)) {
    const codeValue = Reflect.get(error, 'code')
    const code = typeof codeValue === 'string' ? codeValue : error.message
    const details = Reflect.get(error, 'details')
    const status = typeof Reflect.get(error, 'status') === 'number' ? Reflect.get(error, 'status') as number : 400
    return apiError(code, messageForTrailsAcquisitionCode(code), status, isRecord(details) ? details : {})
  }
  return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
}

function isTrailsAcquisitionErrorLike(error: unknown): error is Error & { status: number } {
  if (!(error instanceof Error)) return false
  return typeof Reflect.get(error, 'status') === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
