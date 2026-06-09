import { NextRequest, NextResponse } from 'next/server'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await runEventIngestion({ source: 'cron' })
  return NextResponse.json({ data })
}
