import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/features/merchant/lib/responses'
import { GUIDE_LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS } from '@/features/guide-i18n/lib/locale'

const bodySchema = z.object({ locale: z.enum(GUIDE_LOCALES) })

/** Spec 061 AC-01-02 : mémorise la langue du guide (cookie technique). */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError('INVALID_LOCALE', 'Langue non prise en charge', 400, parsed.error.flatten())
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: parsed.data.locale,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return response
}
