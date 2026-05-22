// src/features/gemini-fetch/services/cache-manager.ts
import { prisma } from '@/shared/lib/prisma'
import type { CacheInfo } from '../types'

const DEFAULT_TTL_HOURS = 24
const STALE_LOCK_MINUTES = 10

export async function getCacheInfo(cityId: string, categoryId: string): Promise<CacheInfo> {
  const cache = await prisma.geminiCache.findUnique({
    where: { city_id_category_id: { city_id: cityId, category_id: categoryId } },
    select: { id: true, expires_at: true, is_fetching: true, updated_at: true },
  })

  if (!cache) return { status: 'absent', cacheId: null, expiresAt: null }

  // Stale lock guard: if is_fetching has been stuck for > STALE_LOCK_MINUTES, treat as absent
  if (cache.is_fetching) {
    const staleCutoff = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000)
    if (cache.updated_at < staleCutoff) {
      await prisma.geminiCache.update({
        where: { id: cache.id },
        data: { is_fetching: false },
      })
      return { status: 'absent', cacheId: cache.id, expiresAt: cache.expires_at }
    }
    return { status: 'fetching', cacheId: cache.id, expiresAt: cache.expires_at }
  }

  const now = new Date()
  const status = cache.expires_at > now ? 'valid' : 'expired'
  return { status, cacheId: cache.id, expiresAt: cache.expires_at }
}

export async function acquireLock(
  cityId: string,
  categoryId: string,
  expiresAt: Date,
): Promise<string> {
  const cache = await prisma.geminiCache.upsert({
    where: { city_id_category_id: { city_id: cityId, category_id: categoryId } },
    create: {
      city_id: cityId,
      category_id: categoryId,
      expires_at: expiresAt,
      is_fetching: true,
      prompt_version: 'v1',
    },
    update: {
      is_fetching: true,
    },
    select: { id: true },
  })
  return cache.id
}

export async function releaseLock(
  cacheId: string,
  expiresAt: Date,
  rawResponse: unknown,
  error?: string,
): Promise<void> {
  await prisma.geminiCache.update({
    where: { id: cacheId },
    data: {
      is_fetching: false,
      fetched_at: error ? undefined : new Date(),
      expires_at: error ? undefined : expiresAt,
      fetch_error: error ?? null,
      raw_response: error ? undefined : (rawResponse as object),
      prompt_version: 'v1',
    },
  })
}

export async function getTtlHours(categorySlug: string): Promise<number> {
  const config = await prisma.cacheTtlConfig.findUnique({
    where: { category_slug: categorySlug },
    select: { ttl_hours: true },
  })
  return config?.ttl_hours ?? DEFAULT_TTL_HOURS
}
