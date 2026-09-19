import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { CityUpdateSchema } from '@/features/admin/schemas/city'
import { CityUpdateError, updateAdminCity } from '@/features/admin/queries/cities'

export async function PATCH(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse((await context.params).slug)
  if (!slug.success) return validationError({ slug: ['Identifiant de ville invalide.'] })

  const parsed = CityUpdateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    const city = await updateAdminCity(slug.data, parsed.data)
    revalidatePath('/admin/cities')
    revalidatePath(`/guide/${city.slug}`, 'layout')
    revalidatePath(`/decouvrir/${city.slug}`, 'layout')
    return NextResponse.json({ data: city })
  } catch (error) {
    if (error instanceof CityUpdateError) return apiError(error.code, error.message, error.status)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return apiError('CITY_NOT_FOUND', 'Ville introuvable.', 404)
    }
    console.error('[admin/cities] Update failed', error)
    return apiError('INTERNAL_ERROR', 'Modification impossible. Réessayez.', 500)
  }
}
