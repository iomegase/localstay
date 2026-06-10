import type { EventPeriod, ParsedEvent } from '../types'
import { normalizeEventTypes } from './event-types'

// DATAtourisme REST API v1 objects (endpoint /v1/entertainmentAndEvent). Shapes are
// permissive (multilingual { '@fr': … }, arrays vs scalars), so we narrow via helpers.
type Json = Record<string, any>

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

// Multilingual value: { '@fr': '…', '@en': '…' } | string. Prefer FR, then EN, then any.
function lang(v: any): string | null {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    if (typeof v['@fr'] === 'string') return v['@fr']
    if (typeof v['@en'] === 'string') return v['@en']
    const first = Object.values(v).find((x) => typeof x === 'string')
    return typeof first === 'string' ? first : null
  }
  return null
}

function firstString(v: any): string | null {
  for (const item of asArray(v)) if (typeof item === 'string') return item
  return null
}

function num(v: any): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function mapDatatourismeObject(obj: Json): ParsedEvent | null {
  if (!obj || typeof obj !== 'object') return null
  const sourceId =
    (typeof obj.uuid === 'string' && obj.uuid) ||
    (typeof obj.identifier === 'string' && obj.identifier) ||
    (typeof obj.uri === 'string' && obj.uri) ||
    null
  if (!sourceId) return null

  const title = lang(obj.label)
  if (!title) return null

  const periods: EventPeriod[] = []
  for (const p of asArray(obj.takesPlaceAt)) {
    const start = typeof p?.startDate === 'string' ? p.startDate : null
    if (!start) continue
    const end = typeof p?.endDate === 'string' ? p.endDate : start
    periods.push({
      start,
      end,
      startTime: typeof p?.startTime === 'string' ? p.startTime : undefined,
      endTime: typeof p?.endTime === 'string' ? p.endTime : undefined,
    })
  }
  if (periods.length === 0) return null
  const startDate = periods.map((p) => p.start).sort()[0]
  const endDate = periods.map((p) => p.end).sort().slice(-1)[0]

  const loc = asArray(obj.isLocatedAt)[0] ?? {}
  const addr = asArray(loc.address)[0] ?? {}
  const city = (addr.hasAddressCity ?? {}) as Json
  const communeInsee = typeof city.insee === 'string' ? city.insee : null
  const communeName = lang(city.label) ?? (typeof addr.addressLocality === 'string' ? addr.addressLocality : null)
  if (!communeInsee || !communeName) return null

  const geo = (loc.geo ?? {}) as Json
  const descObj = asArray(obj.hasDescription)[0] ?? {}
  const description = lang(descObj.shortDescription) ?? lang(descObj.description) ?? null

  const contact = asArray(obj.hasContact)[0] ?? {}
  const images: string[] = []
  for (const rep of asArray(obj.hasMainRepresentation)) {
    for (const res of asArray(rep?.hasRelatedResource)) {
      const url = firstString(res?.locator)
      if (url) images.push(url)
    }
  }

  return {
    sourceId,
    sourceUpdatedAt: typeof obj.lastUpdate === 'string' ? obj.lastUpdate : null,
    title,
    description,
    eventTypes: normalizeEventTypes(asArray(obj.type).filter((t): t is string => typeof t === 'string')),
    startDate,
    endDate,
    isRecurring: periods.length > 1,
    periods,
    communeInsee,
    communeName,
    venueName: typeof loc.name === 'string' ? loc.name : lang(loc.label),
    address: firstString(addr.streetAddress),
    postalCode: typeof addr.postalCode === 'string' ? addr.postalCode : null,
    latitude: num(geo.latitude),
    longitude: num(geo.longitude),
    images,
    website: firstString(contact.homepage),
    phone: firstString(contact.telephone),
    email: firstString(contact.email),
    priceInfo: null,
    raw: obj,
  }
}
