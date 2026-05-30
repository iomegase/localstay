import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminCities } from '@/features/admin/queries/dashboard'
import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'

const POSTAL_CODE_REGEX = /^\d{5}$/

const CityCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  postal_code: z.string().trim().regex(POSTAL_CODE_REGEX, 'Code postal invalide (5 chiffres)'),
  department: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
  region: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
})

const FRANCE_CENTER = { latitude: 46.2276, longitude: 2.2137 }
const DIACRITICS_REGEX = /[̀-ͯ]/g

function toCitySlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || 'ville'
  let suffix = 1
  while (await prisma.city.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }
  return slug
}

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminCities()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await req.json().catch(() => null)
  const parsed = CityCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Payload invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const { name, postal_code, department, region } = parsed.data

  const query = `${name} ${postal_code} France`
  let geocode: Awaited<ReturnType<typeof geocodeAddress>> = null
  try {
    geocode = await geocodeAddress(query, FRANCE_CENTER)
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'GEOCODE_FAILED',
          message: error instanceof Error ? error.message : 'Géocodage indisponible',
        },
      },
      { status: 502 },
    )
  }
  if (!geocode) {
    return NextResponse.json(
      { error: { code: 'GEOCODE_NOT_FOUND', message: 'Aucun résultat Mapbox pour cette ville/CP' } },
      { status: 422 },
    )
  }

  const slug = await uniqueSlug(toCitySlug(name))

  try {
    const city = await prisma.city.create({
      data: {
        name,
        slug,
        postal_code,
        department,
        region,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        is_active: true,
      },
      select: { id: true, slug: true, name: true },
    })
    return NextResponse.json({ data: city }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: { code: 'SLUG_CONFLICT', message: 'Une ville avec ce slug existe déjà' } },
        { status: 409 },
      )
    }
    throw error
  }
}
