import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getDashboardStats } from '@/features/dashboard-owner/queries/stats'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const daysParam = req.nextUrl.searchParams.get('days')
  const days = Math.min(365, Math.max(1, parseInt(daysParam ?? '30', 10) || 30))

  const stats = await getDashboardStats(owner.id, days)
  return NextResponse.json(stats)
}
