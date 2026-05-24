import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'

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

  const now = new Date()
  const [candidates, missingRequests] = await Promise.all([
    prisma.poiAcquisitionCandidate.updateMany({
      where: {
        google_review_expires_at: { lt: now },
        google_review_payload: { not: Prisma.JsonNull },
      },
      data: { google_review_payload: Prisma.JsonNull },
    }),
    prisma.missingPoiRequest.updateMany({
      where: {
        google_review_expires_at: { lt: now },
        google_review_payload: { not: Prisma.JsonNull },
      },
      data: { google_review_payload: Prisma.JsonNull },
    }),
  ])

  return NextResponse.json({
    data: {
      candidates: candidates.count,
      missing_poi_requests: missingRequests.count,
    },
  })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}
