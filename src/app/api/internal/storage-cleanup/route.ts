import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { cleanupUnusedStorageFiles } from '@/features/storage-cleanup/services/weekly-cleanup'

// Spec 070 US-04 : nettoyage hebdomadaire des fichiers inutilisés (Vercel Cron).
export const maxDuration = 300

const BodySchema = z.object({ dry_run: z.boolean().optional() }).strict()

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
}

function unauthorized(): NextResponse {
  return apiError('UNAUTHORIZED', 'Secret interne absent ou invalide', 401)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized()
  return NextResponse.json({ data: await cleanupUnusedStorageFiles({ dryRun: false }) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized()
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return validationError(parsed.error.flatten())
  return NextResponse.json({ data: await cleanupUnusedStorageFiles({ dryRun: parsed.data.dry_run ?? false }) })
}
