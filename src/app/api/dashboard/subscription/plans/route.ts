import { NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { OWNER_PLAN_CATALOG } from '@/features/subscription-owner/plans'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (!owner) return error

  return NextResponse.json({ plans: OWNER_PLAN_CATALOG })
}
