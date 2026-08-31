import {
  auditLodgingJsonLd,
  auditPublicLodgings,
} from '@/features/seo-content-audit/lib/lodging-audit'
import type { PublicLodgingAuditRow } from '@/features/seo-content-audit/queries/audit-data'

function lodging(overrides: Partial<PublicLodgingAuditRow> = {}): PublicLodgingAuditRow {
  return {
    id: 'profile-1',
    slug: 'chalet-hygge',
    publicUrl: '/logements/chalet-hygge',
    title: 'Chalet Hygge',
    shortDescription: 'Un chalet lumineux au pied des montagnes.',
    description: 'Un refuge chaleureux pour profiter du séjour.',
    propertyType: 'Chalet',
    maxGuests: 6,
    bedroomCount: 3,
    bathroomCount: 2,
    bedCount: 4,
    surfaceM2: 70,
    publicAreaLabel: 'Annecy-le-Vieux',
    preciseLocationPublic: false,
    publicLatitude: null,
    publicLongitude: null,
    cityName: 'Annecy',
    cityRegion: 'Auvergne-Rhône-Alpes',
    photos: [],
    amenities: [
      { code: 'wifi', label: 'Wi-Fi', availability: 'included' },
      { code: 'parking', label: 'Parking', availability: 'included' },
      { code: 'kitchen', label: 'Cuisine', availability: 'included' },
    ],
    updatedAt: '2026-08-21T10:00:00.000Z',
    ...overrides,
  }
}

describe('043 lodging text and JSON-LD audit', () => {
  it.each([
    ['Une surface de 65 m².', 'surface_m2', '70', '65 m²'],
    ['Idéal pour 5 voyageurs.', 'max_guests', '6', '5 voyageurs'],
    ['Ce chalet propose 2 chambres.', 'bedroom_count', '3', '2 chambres'],
    ['Le logement comprend 3 couchages.', 'bed_count', '4', '3 couchages'],
    ['Vous disposez de 1,5 salles de bain.', 'bathroom_count', '2', '1,5 salles de bain'],
  ])(
    'reports an explicit mismatch in %s',
    (description, field, structuredValue, excerpt) => {
      const findings = auditPublicLodgings([lodging({ description })])
      const finding = findings.find(({ code }) => code === 'LODGING_STRUCTURED_TEXT_CONFLICT')

      expect(finding).toMatchObject({
        publicUrl: '/logements/chalet-hygge',
        entityType: 'lodging',
        entityId: 'profile-1',
        requiresOwnerDecision: true,
      })
      expect(finding?.evidence.join(' ')).toContain(field)
      expect(finding?.evidence.join(' ')).toContain(structuredValue)
      expect(finding?.evidence.join(' ')).toContain(excerpt)
    },
  )

  it('does not infer a numeric contradiction from an absent mention', () => {
    const findings = auditPublicLodgings([
      lodging({ description: 'Un refuge chaleureux face aux montagnes.' }),
    ])

    expect(findings).not.toContainEqual(
      expect.objectContaining({ code: 'LODGING_STRUCTURED_TEXT_CONFLICT' }),
    )
  })

  it('checks every explicit numeric mention instead of stopping after a matching value', () => {
    const findings = auditPublicLodgings([
      lodging({ description: 'La fiche annonce 70 m². Un ancien paragraphe indique encore 65 m².' }),
    ])

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'LODGING_STRUCTURED_TEXT_CONFLICT',
        evidence: expect.arrayContaining([expect.stringContaining('65 m²')]),
      }),
    )
  })

  it('flags a different known City only after an explicit location cue', () => {
    const annecy = lodging({ description: 'Ce chalet est situé à Chamonix, près des sentiers.' })
    const chamonix = lodging({
      id: 'profile-2',
      slug: 'refuge-chamonix',
      publicUrl: '/logements/refuge-chamonix',
      cityName: 'Chamonix',
    })

    const findings = auditPublicLodgings([annecy, chamonix])

    expect(findings).toContainEqual(
      expect.objectContaining({
        entityId: 'profile-1',
        code: 'LODGING_STRUCTURED_TEXT_CONFLICT',
        evidence: expect.arrayContaining([
          expect.stringContaining('localisation'),
          expect.stringContaining('Chamonix'),
        ]),
      }),
    )
  })

  it('ignores an incidental nearby-City mention without a location cue', () => {
    const findings = auditPublicLodgings([
      lodging({ description: 'Chamonix se rejoint facilement pour une excursion.' }),
      lodging({
        id: 'profile-2',
        slug: 'refuge-chamonix',
        publicUrl: '/logements/refuge-chamonix',
        cityName: 'Chamonix',
      }),
    ])

    expect(findings.filter(({ entityId }) => entityId === 'profile-1')).not.toContainEqual(
      expect.objectContaining({ code: 'LODGING_STRUCTURED_TEXT_CONFLICT' }),
    )
  })

  it.each([
    ['Le logement est proposé sans Wi-Fi.', 'wifi'],
    ['Il ne dispose pas de parking.', 'parking'],
    ['Ce chalet ne dispose pas de cuisine.', 'kitchen'],
  ])('flags the explicit amenity contradiction %s', (description, amenityCode) => {
    const findings = auditPublicLodgings([lodging({ description })])

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'LODGING_STRUCTURED_TEXT_CONFLICT',
        evidence: expect.arrayContaining([expect.stringContaining(amenityCode)]),
      }),
    )
  })

  it('does not flag absent amenity prose or a negated amenity not structurally present', () => {
    const findings = auditPublicLodgings([
      lodging({
        description: 'Le chalet ne dispose pas de sauna.',
        amenities: [{ code: 'wifi', label: 'Wi-Fi', availability: 'included' }],
      }),
    ])

    expect(findings).not.toContainEqual(
      expect.objectContaining({ code: 'LODGING_STRUCTURED_TEXT_CONFLICT' }),
    )
  })

  it('accepts the existing generated lodging schema when every emitted fact is justified', () => {
    expect(auditPublicLodgings([lodging()])).not.toContainEqual(
      expect.objectContaining({ code: 'JSON_LD_VISIBLE_CONTENT_CONFLICT' }),
    )
  })

  it('reports injected occupancy, room, bed, bathroom, floor, amenity, location, URL and provider facts', () => {
    const row = lodging()
    const schema = {
      '@type': 'VacationRental',
      url: 'https://www.mystay.city/logements/autre',
      provider: { '@id': 'https://example.com/#organization' },
      occupancy: { maxValue: 8 },
      numberOfBedrooms: 5,
      numberOfBeds: 7,
      numberOfBathroomsTotal: 4,
      floorSize: { value: 95, unitCode: 'MTK' },
      amenityFeature: [{ name: 'Piscine', value: true }],
      address: { addressLocality: 'Chamonix' },
    }

    const findings = auditLodgingJsonLd(row, schema)
    const evidence = findings.flatMap((finding) => finding.evidence).join(' ')

    expect(findings.every(({ code }) => code === 'JSON_LD_VISIBLE_CONTENT_CONFLICT')).toBe(true)
    for (const fact of [
      'occupancy',
      'numberOfBedrooms',
      'numberOfBeds',
      'numberOfBathroomsTotal',
      'floorSize',
      'Piscine',
      'Chamonix',
      '/logements/autre',
      'provider',
    ]) {
      expect(evidence).toContain(fact)
    }
  })
})
