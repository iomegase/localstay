import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { prisma } from '@/shared/lib/prisma'
import { hardDeleteUserAccount, HardDeleteError } from '@/features/admin/lib/hard-delete'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return validationError(parsed.error.flatten())

  const user = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true, role: true },
  })
  if (!user) return apiError('NOT_FOUND', 'Compte introuvable', 404)
  if (user.role === 'admin') return apiError('FORBIDDEN', 'Compte admin non supprimable', 403)

  try {
    const { deletedLodgings, authDeleted } = await hardDeleteUserAccount(user.id)
    return NextResponse.json({
      message: 'Compte supprimé',
      deleted_lodgings: deletedLodgings,
      auth_deleted: authDeleted,
    })
  } catch (e) {
    if (e instanceof HardDeleteError) return apiError(e.code, e.message, e.status)
    throw e
  }
}
