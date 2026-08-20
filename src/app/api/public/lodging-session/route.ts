import { NextResponse } from 'next/server'
import { lodgingBearerCookie } from '@/features/public-menu/lib/lodging-cookie'

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ data: { cleared: true } })
  response.cookies.set(lodgingBearerCookie('', 0))
  return response
}
