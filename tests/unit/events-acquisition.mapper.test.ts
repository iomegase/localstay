import { mapDatatourismeObject } from '@/features/events-acquisition/lib/datatourisme-mapper'

function baseObject(): Record<string, unknown> {
  return {
    '@id': 'https://data.datatourisme.fr/23/abc-123',
    'dc:identifier': 'EVT-123',
    '@type': ['schema:Event', 'CulturalEvent'],
    'rdfs:label': { '@language': 'fr', '@value': 'Concert au Théâtre' },
    lastUpdate: '2026-05-30',
    hasDescription: [{ 'dc:description': { '@language': 'fr', '@value': 'Un concert symphonique.' } }],
    takesPlaceAt: [{ startDate: '2026-07-12', endDate: '2026-07-12', startTime: '20:00:00', endTime: '22:00:00' }],
    isLocatedAt: [{
      'schema:name': { '@language': 'fr', '@value': 'Théâtre du Mont-Blanc' },
      'schema:address': [{
        'schema:streetAddress': ['1 Place du Mont-Blanc'],
        'schema:postalCode': '74170',
        'schema:addressLocality': 'Saint-Gervais-les-Bains',
        hasAddressCity: { insee: '74236', 'rdfs:label': { '@language': 'fr', '@value': 'Saint-Gervais-les-Bains' } },
      }],
      'schema:geo': { 'schema:latitude': '45.8923', 'schema:longitude': '6.7123' },
    }],
    hasContact: [{ 'schema:telephone': ['+33450000000'], 'schema:email': ['info@example.com'], 'foaf:homepage': ['https://example.com'] }],
    hasMainRepresentation: [{ 'ebucore:hasRelatedResource': [{ 'ebucore:locator': 'https://img.example.com/a.jpg' }] }],
  }
}

describe('mapDatatourismeObject', () => {
  it('mappe un événement complet', () => {
    const e = mapDatatourismeObject(baseObject())!
    expect(e).not.toBeNull()
    expect(e.sourceId).toBe('EVT-123')
    expect(e.title).toBe('Concert au Théâtre')
    expect(e.description).toBe('Un concert symphonique.')
    expect(e.eventTypes).toEqual(['cultural'])
    expect(e.startDate).toBe('2026-07-12')
    expect(e.endDate).toBe('2026-07-12')
    expect(e.isRecurring).toBe(false)
    expect(e.communeInsee).toBe('74236')
    expect(e.communeName).toBe('Saint-Gervais-les-Bains')
    expect(e.venueName).toBe('Théâtre du Mont-Blanc')
    expect(e.address).toBe('1 Place du Mont-Blanc')
    expect(e.postalCode).toBe('74170')
    expect(e.latitude).toBeCloseTo(45.8923)
    expect(e.longitude).toBeCloseTo(6.7123)
    expect(e.images).toEqual(['https://img.example.com/a.jpg'])
    expect(e.phone).toBe('+33450000000')
    expect(e.email).toBe('info@example.com')
    expect(e.website).toBe('https://example.com')
  })

  it('agrège plusieurs périodes (min start / max end) et marque récurrent', () => {
    const o = baseObject()
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

  it('renvoie null si le titre manque', () => {
    const o = baseObject()
    delete o['rdfs:label']
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('renvoie null si la commune (INSEE) manque', () => {
    const o = baseObject()
    ;(o.isLocatedAt as any)[0]['schema:address'][0].hasAddressCity = {}
    expect(mapDatatourismeObject(o)).toBeNull()
  })

  it('tolère les contacts/images absents', () => {
    const o = baseObject()
    delete o.hasContact
    delete o.hasMainRepresentation
    const e = mapDatatourismeObject(o)!
    expect(e.images).toEqual([])
    expect(e.phone).toBeNull()
    expect(e.website).toBeNull()
  })
})
