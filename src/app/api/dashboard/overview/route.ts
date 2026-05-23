import { NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getOverviewMetrics } from '@/features/dashboard-owner/queries/overview'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const metrics = await getOverviewMetrics(owner.id)
  return NextResponse.json(metrics)
}
