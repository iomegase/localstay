import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseRouteClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
