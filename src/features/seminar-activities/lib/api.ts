import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'
import { apiError } from '@/features/merchant/lib/responses'
import { SEMINAR_ACTIVITY_ERROR_MESSAGES, SeminarActivityError } from '../queries/admin'

export async function readJsonBody(req: Request): Promise<unknown> {
  return req.json().catch(() => undefined)
}

export function validationErrorResponse(error?: ZodError): NextResponse {
  return apiError('VALIDATION_ERROR', 'Paramètres invalides', 400, error ? error.flatten() : {})
}

/** Spec 097 API Contract : erreurs métier connues, sinon 500 sans détail interne. */
export function seminarActivityErrorResponse(error: unknown): NextResponse {
  if (error instanceof SeminarActivityError) {
    return apiError(error.code, SEMINAR_ACTIVITY_ERROR_MESSAGES[error.code], error.status)
  }
  console.error('[seminar-activities] opération impossible', error)
  return apiError('SEMINAR_ACTIVITY_FAILED', 'Opération impossible', 500)
}
