import {
  lodgingPlaceSchema,
  vacationRentalSchema,
  type JsonLdObject,
} from '@/features/seo/lib/structured-data'
import { organizationId, siteBaseUrl } from '@/features/seo/lib/site'
import { selectVisibleLodgingPhotos } from '@/features/lodging-showcase/lib/detail-view'
import type { PublicLodgingAuditRow } from '../queries/audit-data'
import type { SeoContentAuditFinding } from '../types'
import { normalizeAuditText } from './text-audit'

type NumericDescriptor = {
  field: 'surface_m2' | 'max_guests' | 'bedroom_count' | 'bed_count' | 'bathroom_count'
  pattern: RegExp
  structured: (row: PublicLodgingAuditRow) => number | null
}

const NUMERIC_DESCRIPTORS: NumericDescriptor[] = [
  {
    field: 'surface_m2',
    pattern: /(\d+(?:[.,]\d+)?)\s*m(?:²|2)(?=\s|[.,;:!?)]|$)/iu,
    structured: row => row.surfaceM2,
  },
  {
    field: 'max_guests',
    pattern: /(\d+)\s*(?:voyageurs?|personnes?)\b/iu,
    structured: row => row.maxGuests,
  },
  {
    field: 'bedroom_count',
    pattern: /(\d+)\s*chambres?\b/iu,
    structured: row => row.bedroomCount,
  },
  {
    field: 'bed_count',
    pattern: /(\d+)\s*(?:lits?|couchages?)\b/iu,
    structured: row => row.bedCount,
  },
  {
    field: 'bathroom_count',
    pattern: /(\d+(?:[.,]\d+)?)\s*salles?\s+de\s+bains?\b/iu,
    structured: row => row.bathroomCount,
  },
]

const NEGATED_AMENITIES: Array<{ keys: string[]; pattern: RegExp }> = [
  { keys: ['wifi', 'wi fi'], pattern: /(?:sans|pas de|ne dispose pas de)\s+wi[ -]?fi\b/iu },
  { keys: ['parking'], pattern: /(?:sans|pas de|ne dispose pas de)\s+parking\b/iu },
  { keys: ['cuisine', 'kitchen'], pattern: /(?:sans|pas de|ne dispose pas de)\s+cuisine\b/iu },
]

function lodgingFinding(
  row: PublicLodgingAuditRow,
  code: Extract<
    SeoContentAuditFinding['code'],
    'LODGING_STRUCTURED_TEXT_CONFLICT' | 'JSON_LD_VISIBLE_CONTENT_CONFLICT'
  >,
  evidence: string[],
): SeoContentAuditFinding {
  return {
    publicUrl: row.publicUrl,
    entityType: 'lodging',
    entityId: row.id,
    code,
    evidence,
    updatedAt: row.updatedAt,
    requiresOwnerDecision: true,
  }
}

function visibleText(row: PublicLodgingAuditRow): string {
  return `${row.shortDescription}\n${row.description}`.trim()
}

function shortestSentenceAroundMatch(
  value: string,
  matchIndex: number,
  matchLength: number,
): string {
  const before = value.slice(0, matchIndex)
  const after = value.slice(matchIndex + matchLength)
  const startBoundary = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf('\n'),
  )
  const afterBoundaries = ['.', '!', '?', '\n']
    .map(separator => after.indexOf(separator))
    .filter(index => index >= 0)
  const endOffset = afterBoundaries.length > 0 ? Math.min(...afterBoundaries) : after.length
  return value
    .slice(startBoundary + 1, matchIndex + matchLength + endOffset)
    .trim()
    .slice(0, 180)
}

function shortestSentenceAround(value: string, pattern: RegExp): string {
  const match = pattern.exec(value)
  if (!match || match.index === undefined) return value.slice(0, 180).trim()
  return shortestSentenceAroundMatch(value, match.index, match[0].length)
}

function numericTextFindings(row: PublicLodgingAuditRow): SeoContentAuditFinding[] {
  const text = visibleText(row)
  const findings: SeoContentAuditFinding[] = []

  for (const descriptor of NUMERIC_DESCRIPTORS) {
    const globalPattern = new RegExp(descriptor.pattern.source, `${descriptor.pattern.flags}g`)
    for (const match of text.matchAll(globalPattern)) {
      if (descriptor.field === 'surface_m2') {
        const nearbyPrefix = normalizeAuditText(
          text.slice(Math.max(0, match.index - 80), match.index),
        )
        if (
          /\b(?:terrasse|balcon|jardin|garage|chambre|cuisine|salon|sejour|salle de bain|piscine|spa)\b[^.!?]*$/u
            .test(nearbyPrefix)
        ) {
          continue
        }
      }
      const mentioned = Number(match[1].replace(',', '.'))
      const structured = descriptor.structured(row)
      if (structured !== null && mentioned === structured) continue

      findings.push(lodgingFinding(row, 'LODGING_STRUCTURED_TEXT_CONFLICT', [
        `Champ structuré ${descriptor.field} : ${structured ?? 'absent'}.`,
        `Extrait contradictoire : « ${shortestSentenceAroundMatch(text, match.index, match[0].length)} ».`,
      ]))
    }
  }
  return findings
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function locationTextFindings(
  row: PublicLodgingAuditRow,
  knownCityNames: string[],
): SeoContentAuditFinding[] {
  const normalizedText = normalizeAuditText(visibleText(row))
  const ownLocations = new Set([
    normalizeAuditText(row.cityName),
    normalizeAuditText(row.publicAreaLabel ?? ''),
  ])

  for (const cityName of knownCityNames) {
    const normalizedCity = normalizeAuditText(cityName)
    if (!normalizedCity || ownLocations.has(normalizedCity)) continue
    const cue = new RegExp(
      `(?:situee? a|au coeur de|dans le centre de)\\s+${escapeRegExp(normalizedCity)}(?:\\s|$)`,
      'u',
    )
    if (!cue.test(normalizedText)) continue

    return [lodgingFinding(row, 'LODGING_STRUCTURED_TEXT_CONFLICT', [
      `Localisation structurée : ${row.publicAreaLabel ?? row.cityName} (${row.cityName}).`,
      `Mention explicite de localisation contradictoire : ${cityName}.`,
    ])]
  }
  return []
}

function amenityTextFindings(row: PublicLodgingAuditRow): SeoContentAuditFinding[] {
  const text = visibleText(row)

  return NEGATED_AMENITIES.flatMap((descriptor) => {
    const match = descriptor.pattern.exec(text)
    if (!match) return []
    const normalizedKeys = new Set(descriptor.keys.map(normalizeAuditText))
    const amenity = row.amenities.find(item => (
      normalizedKeys.has(normalizeAuditText(item.code))
      || normalizedKeys.has(normalizeAuditText(item.label))
    ))
    if (!amenity) return []

    return [lodgingFinding(row, 'LODGING_STRUCTURED_TEXT_CONFLICT', [
      `Équipement structuré présent : ${amenity.code} (${amenity.label}).`,
      `Extrait contradictoire : « ${shortestSentenceAround(text, descriptor.pattern)} ».`,
    ])]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numericValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function auditLodgingJsonLd(
  row: PublicLodgingAuditRow,
  schema: JsonLdObject,
): SeoContentAuditFinding[] {
  const findings: SeoContentAuditFinding[] = []
  const conflict = (fact: string, actual: unknown, expected: unknown) => {
    findings.push(lodgingFinding(row, 'JSON_LD_VISIBLE_CONTENT_CONFLICT', [
      `Fait JSON-LD ${fact}=${JSON.stringify(actual)} non justifié ; valeur structurée/visible attendue=${JSON.stringify(expected)}.`,
    ]))
  }

  const expectedUrl = `${siteBaseUrl()}${row.publicUrl}`
  if (schema.url !== expectedUrl) conflict('url', schema.url, expectedUrl)

  const provider = isRecord(schema.provider) ? schema.provider['@id'] : null
  if (provider !== organizationId()) conflict('provider', provider, organizationId())

  if (isRecord(schema.occupancy)) {
    const occupancy = numericValue(schema.occupancy.maxValue)
    if (occupancy !== row.maxGuests) conflict('occupancy.maxValue', occupancy, row.maxGuests)
  }

  const numericFacts: Array<[string, unknown, number | null]> = [
    ['numberOfBedrooms', schema.numberOfBedrooms, row.bedroomCount],
    ['numberOfBeds', schema.numberOfBeds, row.bedCount],
    ['numberOfBathroomsTotal', schema.numberOfBathroomsTotal, row.bathroomCount],
  ]
  for (const [fact, rawValue, expected] of numericFacts) {
    if (rawValue === undefined) continue
    const actual = numericValue(rawValue)
    if (actual !== expected) conflict(fact, actual, expected)
  }

  if (schema.floorSize !== undefined) {
    const floorSize = isRecord(schema.floorSize)
      ? numericValue(schema.floorSize.value)
      : numericValue(schema.floorSize)
    if (floorSize !== row.surfaceM2) conflict('floorSize', floorSize, row.surfaceM2)
  }

  const expectedAmenities = new Set(row.amenities.map(amenity => normalizeAuditText(amenity.label)))
  if (Array.isArray(schema.amenityFeature)) {
    for (const feature of schema.amenityFeature) {
      if (!isRecord(feature) || feature.value !== true || typeof feature.name !== 'string') continue
      if (!expectedAmenities.has(normalizeAuditText(feature.name))) {
        conflict(`amenityFeature.${feature.name}`, true, false)
      }
    }
  }

  if (isRecord(schema.address)) {
    const locality = schema.address.addressLocality
    const expectedLocalities = [row.publicAreaLabel, row.cityName].filter(Boolean)
    if (typeof locality === 'string' && !expectedLocalities.includes(locality)) {
      conflict('address.addressLocality', locality, expectedLocalities)
    }
  }

  if (isRecord(schema.geo)) {
    const latitude = numericValue(schema.geo.latitude)
    const longitude = numericValue(schema.geo.longitude)
    if (
      !row.preciseLocationPublic
      || latitude !== row.publicLatitude
      || longitude !== row.publicLongitude
    ) {
      conflict('geo', { latitude, longitude }, row.preciseLocationPublic
        ? { latitude: row.publicLatitude, longitude: row.publicLongitude }
        : 'absent')
    }
  }

  const expectedImages = new Set(selectVisibleLodgingPhotos(row.photos).map(photo => photo.url))
  if (Array.isArray(schema.image)) {
    for (const image of schema.image) {
      if (typeof image === 'string' && !expectedImages.has(image)) {
        conflict('image', image, 'photo visible')
      }
    }
  }

  return findings
}

function buildLodgingSchema(row: PublicLodgingAuditRow): JsonLdObject {
  const input = {
    id: row.id,
    title: row.title,
    shortDescription: row.shortDescription,
    description: row.description,
    cityName: row.cityName,
    cityRegion: row.cityRegion,
    slug: row.slug,
    propertyType: row.propertyType,
    maxGuests: row.maxGuests,
    publicAreaLabel: row.publicAreaLabel,
    preciseLocationPublic: row.preciseLocationPublic,
    publicLatitude: row.publicLatitude,
    publicLongitude: row.publicLongitude,
    photos: row.photos,
    amenities: row.amenities.map(({ code, label }) => ({ code, label })),
  }
  return vacationRentalSchema(input) ?? lodgingPlaceSchema(input)
}

export function auditPublicLodgings(
  rows: PublicLodgingAuditRow[],
): SeoContentAuditFinding[] {
  const knownCityNames = [...new Set(rows.map(row => row.cityName))]
  const findings = rows.flatMap(row => [
    ...numericTextFindings(row),
    ...locationTextFindings(row, knownCityNames),
    ...amenityTextFindings(row),
    ...auditLodgingJsonLd(row, buildLodgingSchema(row)),
  ])

  return findings.sort((left, right) => (
    left.code.localeCompare(right.code, 'fr')
    || left.publicUrl.localeCompare(right.publicUrl, 'fr')
    || left.evidence.join(' ').localeCompare(right.evidence.join(' '), 'fr')
  ))
}
