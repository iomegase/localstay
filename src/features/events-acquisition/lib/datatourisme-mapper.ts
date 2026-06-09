import type { EventPeriod, ParsedEvent } from '../types'
import { normalizeEventTypes } from './event-types'

type Json = Record<string, any>

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function firstString(v: any): string | null {
  for (const item of asArray(v)) {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && typeof item['@value'] === 'string') return item['@value']
  }
  return null
}

function localized(v: any): string | null {
  for (const item of asArray(v)) {
    if (item && typeof item === 'object' && item['@language'] === 'fr' && typeof item['@value'] === 'string') {
      return item['@value']
    }
  }
  return firstString(v)
}

function num(v: any): number | null {
  const s = Array.isArray(v) ? v[0] : v
  const n = typeof s === 'string' ? parseFloat(s) : typeof s === 'number' ? s : NaN
  return Number.isFinite(n) ? n : null
}

export function mapDatatourismeObject(obj: Json): ParsedEvent | null {
  const sourceId = firstString(obj['dc:identifier']) ?? (typeof obj['@id'] === 'string' ? obj['@id'] : null)
  if (!sourceId) return null

  const title = localized(obj['rdfs:label'])
  if (!title) return null

  const periods: EventPeriod[] = []
  for (const p of asArray(obj['takesPlaceAt'])) {
    const start = firstString(p?.['startDate'])
    if (!start) continue
    const end = firstString(p?.['endDate']) ?? start
    periods.push({
      start,
      end,
      startTime: firstString(p?.['startTime']) ?? undefined,
      endTime: firstString(p?.['endTime']) ?? undefined,
    })
  }
  if (periods.length === 0) return null
  const startDate = periods.map((p) => p.start).sort()[0]
  const endDate = periods.map((p) => p.end).sort().slice(-1)[0]

  const loc = asArray(obj['isLocatedAt'])[0] ?? {}
  const addr = asArray(loc['schema:address'])[0] ?? {}
  const city = asArray(addr['hasAddressCity'])[0] ?? {}
  const communeInsee = firstString(city['insee'])
  const communeName = localized(city['rdfs:label']) ?? firstString(addr['schema:addressLocality'])
  if (!communeInsee || !communeName) return null

  const geo = asArray(loc['schema:geo'])[0] ?? {}

  const descObj = asArray(obj['hasDescription'])[0] ?? {}
  const description =
    localized(descObj['dc:description']) ??
    localized(descObj['shortDescription']) ??
    localized(obj['rdfs:comment'])

  const contact = asArray(obj['hasContact'])[0] ?? {}
  const images: string[] = []
  for (const rep of asArray(obj['hasMainRepresentation'])) {
    for (const res of asArray(rep?.['ebucore:hasRelatedResource'])) {
      const url = firstString(res?.['ebucore:locator'])
      if (url) images.push(url)
    }
  }

  return {
    sourceId,
    sourceUpdatedAt: firstString(obj['lastUpdate']),
    title,
    description,
    eventTypes: normalizeEventTypes(asArray(obj['@type']).filter((t): t is string => typeof t === 'string')),
    startDate,
    endDate,
    isRecurring: periods.length > 1,
    periods,
    communeInsee,
    communeName,
    venueName: localized(loc['schema:name']) ?? localized(loc['rdfs:label']),
    address: firstString(addr['schema:streetAddress']),
    postalCode: firstString(addr['schema:postalCode']),
    latitude: num(geo['schema:latitude']),
    longitude: num(geo['schema:longitude']),
    images,
    website: firstString(contact['foaf:homepage']) ?? firstString(contact['schema:url']),
    phone: firstString(contact['schema:telephone']),
    email: firstString(contact['schema:email']),
    priceInfo: null,
    raw: obj,
  }
}
