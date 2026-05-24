import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { getAdminUsers } from '@/features/admin/queries/dashboard'

const RoleSchema = z.enum(['owner', 'merchant', 'admin']).optional()

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = RoleSchema.safeParse(req.nextUrl.searchParams.get('role') ?? undefined)
  if (!parsed.success) {
    return validationError({ role: ['Role invalide'] })
  }

  const data = await getAdminUsers(parsed.data)
  return NextResponse.json({ data })
}
