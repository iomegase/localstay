// src/features/gemini-fetch/services/poi-persister.ts
import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import type { GeminiRawPoi } from '../types'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 100)
    .replace(/^-|-$/g, '')
}

interface PersistContext {
  cityId: string
  categoryId: string
  cityLatitude: number
  cityLongitude: number
}

export async function persistPois(
  pois: GeminiRawPoi[],
  ctx: PersistContext,
): Promise<number> {
  let count = 0

  for (const poi of pois) {
    const slug = toSlug(poi.name)
    if (!slug) continue

    // Resolve optional subcategory by name match within this category
    let subcategoryId: string | null = null
    if (poi.subcategory) {
      const sub = await prisma.subCategory.findFirst({
        where: {
          category_id: ctx.categoryId,
          name: { equals: poi.subcategory, mode: 'insensitive' },
          is_active: true,
          deleted_at: null,
        },
        select: { id: true },
      })
      subcategoryId = sub?.id ?? null
    }

    await prisma.pointOfInterest.upsert({
      where: { city_id_slug: { city_id: ctx.cityId, slug } },
      create: {
        name: poi.name,
        slug,
        description: poi.description,
        address: poi.address,
        latitude: ctx.cityLatitude,   // placeholder — enriched by Mapbox in MVP 2+
        longitude: ctx.cityLongitude, // placeholder
        phone: poi.phone,
        website: poi.website,
        hours: poi.hours ?? undefined,
        tags: poi.tags,
        is_active: true,
        city_id: ctx.cityId,
        category_id: ctx.categoryId,
        subcategory_id: subcategoryId,
      },
      update: {
        name: poi.name,
        description: poi.description,
        address: poi.address,
        phone: poi.phone,
        website: poi.website,
        hours: poi.hours ?? Prisma.JsonNull,
        tags: poi.tags,
        subcategory_id: subcategoryId,
      },
    })
    count++
  }

  return count
}
