import { NextResponse } from 'next/server'

type ErrorDetails = Record<string, unknown>

export function apiError(
  code: string,
  message: string,
  status: number,
  details: ErrorDetails = {},
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status })
}

export function validationError(details: ErrorDetails): NextResponse {
  return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, details)
}
