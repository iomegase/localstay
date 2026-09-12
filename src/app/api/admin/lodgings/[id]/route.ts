import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { prisma } from '@/shared/lib/prisma'
import { hardDeleteLodging } from '@/features/admin/lib/hard-delete'
import { revalidatePublicLodgingPaths } from '@/features/lodging-showcase/lib/revalidation'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return validationError(parsed.error.flatten())

  const lodging = await prisma.lodging.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      city: { select: { slug: true } },
      public_profile: { select: { city: { select: { slug: true } } } },
    },
  })
  if (!lodging) return apiError('NOT_FOUND', 'Logement introuvable', 404)

  await prisma.$transaction(tx => hardDeleteLodging(tx, lodging.id))
  revalidatePublicLodgingPaths([lodging.city.slug, lodging.public_profile?.city.slug])

  return NextResponse.json({ message: 'Logement supprimé' })
}
