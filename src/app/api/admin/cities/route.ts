import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminCities } from '@/features/admin/queries/dashboard'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminCities()
  return NextResponse.json({ data })
}
