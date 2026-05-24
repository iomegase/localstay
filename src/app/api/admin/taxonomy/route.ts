import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminTaxonomy } from '@/features/admin-taxonomy/queries/taxonomy'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminTaxonomy()
  return NextResponse.json({ data })
}
