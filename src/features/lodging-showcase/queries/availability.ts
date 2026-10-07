import { lookup } from 'node:dns/promises'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import { availabilityHorizon, parisToday, parseIcalBusyRanges, type BusyRange } from '../lib/availability'
import { isPublicIpAddress, isSafePublicHttpsUrl } from '../lib/ical-url'

// Spec 089 BR-03 / BR-04.
const CACHE_SECONDS = 3600
const TIMEOUT_MS = 5000
const MAX_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>
export type Resolver = (hostname: string) => Promise<string[]>

const resolveAll: Resolver = async hostname => (await lookup(hostname, { all: true })).map(entry => entry.address)

async function readLimited(response: Response): Promise<string | null> {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) return null
  if (!response.body) return null
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

/** Lit un calendrier iCal en respectant BR-04 ; `null` si refusé, injoignable ou trop gros. */
export async function fetchIcal(url: string, fetcher: FetchLike = fetch, resolve: Resolver = resolveAll): Promise<string | null> {
  let current = url
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isSafePublicHttpsUrl(current)) return null
    const addresses = await resolve(new URL(current).hostname).catch(() => [])
    if (addresses.length === 0 || !addresses.every(isPublicIpAddress)) return null

    const response = await fetcher(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/calendar, text/plain;q=0.9' },
      cache: 'no-store',
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return null
      current = new URL(location, current).toString()
      continue
    }
    if (!response.ok) return null
    const text = await readLimited(response)
    return text && text.includes('BEGIN:VCALENDAR') ? text : null
  }
  return null
}

export type LodgingAvailability = { today: string; busy: BusyRange[] }

async function loadAvailability(url: string, today: string): Promise<LodgingAvailability | null> {
  try {
    const ics = await fetchIcal(url)
    return ics ? { today, busy: parseIcalBusyRanges(ics, availabilityHorizon(today)) } : null
  } catch {
    return null
  }
}

/** AC-02-01 / AC-02-03 : disponibilités d'un logement publié, `null` sans lien ou calendrier illisible. */
export async function getLodgingAvailability(profileId: string): Promise<LodgingAvailability | null> {
  const profile = await prisma.lodgingPublicProfile.findFirst({
    where: { id: profileId, publication_status: 'published', deleted_at: null },
    select: { availability_ical_url: true },
  })
  const url = profile?.availability_ical_url
  if (!url) return null
  const today = parisToday()
  return unstable_cache(() => loadAvailability(url, today), ['lodging-availability', profileId, url, today], {
    revalidate: CACHE_SECONDS,
  })()
}
