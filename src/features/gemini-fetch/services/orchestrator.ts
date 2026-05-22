// src/features/gemini-fetch/services/orchestrator.ts
import { prisma } from '@/shared/lib/prisma'
import { buildGeminiPrompt } from './prompt-builder'
import { callGemini } from './gemini-client'
import { filterPois } from './poi-filter'
import { persistPois } from './poi-persister'
import { acquireLock, getCacheInfo, getTtlHours, releaseLock } from './cache-manager'
import type { GeminiFetchResult, FetchParams } from '../types'

const RADIUS_KM = 10 // OQ-03: fixed 10km for MVP

export async function runGeminiFetch(params: FetchParams): Promise<GeminiFetchResult> {
  const { cityId, categoryId, forceRefresh = false } = params

  // Load city and category for context
  const [city, category] = await Promise.all([
    prisma.city.findUnique({
      where: { id: cityId },
      select: { name: true, postal_code: true, latitude: true, longitude: true },
    }),
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, slug: true },
    }),
  ])
  if (!city || !category) throw new Error(`City or category not found: ${cityId} / ${categoryId}`)

  // Check cache (skip if force_refresh)
  const cacheInfo = await getCacheInfo(cityId, categoryId)

  if (!forceRefresh) {
    if (cacheInfo.status === 'valid') {
      return {
        status: 'cached',
        poi_count: await countPois(cityId, categoryId),
        expires_at: cacheInfo.expiresAt?.toISOString(),
      }
    }
    if (cacheInfo.status === 'fetching') {
      // BR-04: lock held — AC-03-02
      return { status: 'cached', poi_count: await countPois(cityId, categoryId) }
    }
  }

  // Acquire lock + compute TTL
  const ttlHours = await getTtlHours(category.slug)
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)
  let cacheId: string | undefined

  try {
    cacheId = await acquireLock(cityId, categoryId, expiresAt)
    // Build prompt and call Gemini
    const prompt = buildGeminiPrompt({
      cityName: city.name,
      postalCode: city.postal_code,
      categoryName: category.name,
      radiusKm: RADIUS_KM,
    })

    const rawPois = await callGemini(prompt)
    const filtered = filterPois(rawPois)

    const poiCount = await persistPois(filtered, {
      cityId,
      categoryId,
      cityLatitude: city.latitude,
      cityLongitude: city.longitude,
    })

    // raw_response stores the unfiltered Gemini output for audit/debug purposes
    await releaseLock(cacheId, expiresAt, { pois: rawPois })

    // Spec 008: fire-and-forget geocoding after successful Gemini Fetch
    void triggerGeocode(cityId)

    return { status: 'fetched', poi_count: poiCount, expires_at: expiresAt.toISOString() }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[GeminiFetch] Error for city=${cityId} category=${categoryId}:`, message)
    if (cacheId) {
      await releaseLock(cacheId, expiresAt, null, message)
    }

    // AC-03-03: serve stale data (return what's in DB)
    return {
      status: 'error',
      poi_count: await countPois(cityId, categoryId),
      error: message,
    }
  }
}

async function countPois(cityId: string, categoryId: string): Promise<number> {
  return prisma.pointOfInterest.count({
    where: { city_id: cityId, category_id: categoryId, is_active: true, deleted_at: null },
  })
}

async function triggerGeocode(cityId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return
  try {
    await fetch(`${baseUrl}/api/internal/geocode-pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ city_id: cityId, limit: 10 }),
    })
  } catch {
    // Non-blocking — geocoding failure never breaks Gemini Fetch response
  }
}
