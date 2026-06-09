import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { listEvents } from '@/features/events-acquisition/queries/events'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await listEvents()
  return NextResponse.json({ data })
}
