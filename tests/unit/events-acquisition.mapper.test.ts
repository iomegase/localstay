import { mapDatatourismeObject } from '@/features/events-acquisition/lib/datatourisme-mapper'

// Structure réelle d'un objet de l'API REST v1 /v1/entertainmentAndEvent (+ fields).
function baseEvent(): Record<string, unknown> {
  return {
    uuid: '00006252-93a7-3a33-960d-e0cc7002f071',
    identifier: 'EVT-XYZ',
    uri: 'https://data.datatourisme.fr/0/00006252',
    label: { '@fr': 'Concert au Château', '@en': 'Concert at the Castle' },
    type: ['PointOfInterest', 'Event', 'EntertainmentAndEvent', 'CulturalEvent'],
    lastUpdate: '2026-05-26',
    takesPlaceAt: [{ startDate: '2026-07-12', endDate: '2026-07-12', startTime: '20:00' }],
    hasDescription: [{ shortDescription: { '@fr': 'Un concert.', '@en': 'A concert.' } }],
    isLocatedAt: [
      {
        geo: { latitude: 45.8923, longitude: 6.7123 },
        address: [
          {
            hasAddressCity: { insee: '74236', label: { '@fr': 'Saint-Gervais-les-Bains' } },
            streetAddress: ['1 Place du Mont-Blanc'],
            postalCode: '74170',
            addressLocality: 'Saint-Gervais-les-Bains',
          },
        ],
      },
    ],
    hasContact: [{ telephone: ['+33450000000'], email: ['info@example.com'], homepage: ['https://example.com'] }],
    hasMainRepresentation: [{ hasRelatedResource: [{ locator: ['https://img.example.com/a.jpg'] }] }],
  }
}

describe('mapDatatourismeObject (REST v1)', () => {
  it('mappe un événement complet', () => {
    const e = mapDatatourismeObject(baseEvent())!
    expect(e.sourceId).toBe('00006252-93a7-3a33-960d-e0cc7002f071')
    expect(e.title).toBe('Concert au Château')
    expect(e.description).toBe('Un concert.')
    expect(e.eventTypes).toEqual(['cultural'])
    expect(e.startDate).toBe('2026-07-12')
    expect(e.endDate).toBe('2026-07-12')
    expect(e.isRecurring).toBe(false)
    expect(e.communeInsee).toBe('74236')
    expect(e.communeName).toBe('Saint-Gervais-les-Bains')
    expect(e.address).toBe('1 Place du Mont-Blanc')
    expect(e.postalCode).toBe('74170')
    expect(e.latitude).toBeCloseTo(45.8923)
    expect(e.longitude).toBeCloseTo(6.7123)
    expect(e.images).toEqual(['https://img.example.com/a.jpg'])
    expect(e.phone).toBe('+33450000000')
    expect(e.email).toBe('info@example.com')
    expect(e.website).toBe('https://example.com')
  })

  it('prend @fr puis @en en repli pour le titre', () => {
    const o = baseEvent()
    o.label = { '@en': 'Only English' }
    expect(mapDatatourismeObject(o)!.title).toBe('Only English')
  })

  it('agrège plusieurs périodes (min/max) et marque récurrent', () => {
    const o = baseEvent()
    o.takesPlaceAt = [
      { startDate: '2026-07-12', endDate: '2026-07-12' },
      { startDate: '2026-07-20', endDate: '2026-07-21' },
    ]
    const e = mapDatatourismeObject(o)!
    expect(e.startDate).toBe('2026-07-12')
    expect(e.endDate).toBe('2026-07-21')
    expect(e.isRecurring).toBe(true)
    expect(e.periods).toHaveLength(2)
  })

  it('endDate par défaut = startDate si absente', () => {
    const o = baseEvent()
    o.takesPlaceAt = [{ startDate: '2026-08-01' }]
    const e = mapDatatourismeObject(o)!
    expect(e.startDate).toBe('2026-08-01')
    expect(e.endDate).toBe('2026-08-01')
  })

  it('renvoie null si titre manquant', () => {
    const o = baseEvent()
    delete o.label
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('renvoie null si INSEE commune manquant', () => {
    const o = baseEvent()
    ;(o.isLocatedAt as any)[0].address[0].hasAddressCity = {}
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('renvoie null si aucune période', () => {
    const o = baseEvent()
    delete o.takesPlaceAt
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('tolère contacts/images absents', () => {
    const o = baseEvent()
    delete o.hasContact
    delete o.hasMainRepresentation
    const e = mapDatatourismeObject(o)!
    expect(e.images).toEqual([])
    expect(e.phone).toBeNull()
    expect(e.website).toBeNull()
  })
})
