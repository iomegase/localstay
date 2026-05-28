import { NextResponse } from 'next/server'
import { LODGING_COOKIE_NAME } from '@/features/public-menu/lib/lodging-mode'

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ data: { cleared: true } })
  response.cookies.set({
    name: LODGING_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
  })
  return response
}
