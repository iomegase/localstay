import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { cityTransportCardsSchema } from '@/features/transport/schemas'
import {
  CityTransportCardsError,
  getCityTransportCards,
  getCityTransportPoiOptions,
  saveCityTransportCards,
} from '@/features/transport/queries/city-transport-cards'

type Context = { params: Promise<{ slug: string }> }

const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

function handleError(error: unknown): NextResponse {
  if (error instanceof CityTransportCardsError) return apiError(error.code, error.message, error.status)
  console.error('[admin/cities/transport-cards] failed', error)
  return apiError('INTERNAL_ERROR', 'Enregistrement impossible. Réessayez.', 500)
}

/** Cartes « Se déplacer » d'une ville (spec 055 AC-03-02). */
export async function GET(_request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const slug = slugSchema.safeParse((await context.params).slug)
  if (!slug.success) return validationError({ slug: ['Identifiant de ville invalide.'] })

  try {
    const [data, poiOptions] = await Promise.all([
      getCityTransportCards(slug.data),
      getCityTransportPoiOptions(slug.data),
    ])
    return NextResponse.json({ data, poiOptions })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const slug = slugSchema.safeParse((await context.params).slug)
  if (!slug.success) return validationError({ slug: ['Identifiant de ville invalide.'] })

  const parsed = cityTransportCardsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    const cards = await saveCityTransportCards(slug.data, parsed.data)
    revalidatePath('/sejour', 'layout')
    return NextResponse.json({ data: cards })
  } catch (error) {
    return handleError(error)
  }
}
