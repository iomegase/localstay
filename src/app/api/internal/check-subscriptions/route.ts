import { NextRequest, NextResponse } from 'next/server'
import { expirePastDueTrials } from '@/features/subscription-owner/queries/subscription'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: {} } }, { status: 401 })
  }

  const result = await expirePastDueTrials()
  return NextResponse.json({ data: { updated: result.count } })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}
