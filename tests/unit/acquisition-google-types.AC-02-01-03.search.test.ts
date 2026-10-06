import { searchGooglePlaceCandidates } from '@/features/poi-acquisition/lib/google-places'

// Spec 073 — recherche Google filtrée par type.
const originalEnv = process.env

function place(id: string, primaryType: string) {
  return { id, displayName: { text: id }, formattedAddress: `${id} rue`, primaryType, types: [primaryType, 'food'] }
}

const baseParams = {
  cityName: 'Saint-Gervais-les-Bains', postalCode: '74170', categoryName: 'Cafés',
  subcategoryNames: ['Café', 'Salon de thé'], latitude: 45.89, longitude: 6.71,
}

describe('073 — recherche par type', () => {
  beforeEach(() => { process.env = { ...originalEnv, GOOGLE_PLACES_API_KEY: 'k' } })
  afterAll(() => { process.env = originalEnv })

  it('AC-02-01 / AC-02-02 : une requête stricte par type, sous-catégorie propagée, types lus', async () => {
    const bodies: Array<Record<string, unknown>> = []
    const headers: Array<Record<string, string>> = []
    global.fetch = jest.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      bodies.push(body)
      headers.push(init?.headers as Record<string, string>)
      const places = body.includedType === 'tea_house' ? [place('the-1', 'tea_house')] : [place('cafe-1', 'cafe')]
      return { ok: true, status: 200, json: async () => ({ places }) }
    }) as jest.Mock

    const candidates = await searchGooglePlaceCandidates({
      ...baseParams,
      typeQueries: [
        { includedType: 'cafe', query_subcategory_name: 'Café' },
        { includedType: 'tea_house', query_subcategory_name: 'Salon de thé' },
      ],
    })

    expect(bodies.map(body => [body.textQuery, body.includedType, body.strictTypeFiltering])).toEqual([
      ['Café Saint-Gervais-les-Bains', 'cafe', true],
      ['Salon de thé Saint-Gervais-les-Bains', 'tea_house', true],
    ])
    expect(headers[0]!['X-Goog-FieldMask']).toContain('places.primaryType')
    expect(headers[0]!['X-Goog-FieldMask']).toContain('places.types')
    expect(candidates).toEqual([
      expect.objectContaining({ google_place_id: 'cafe-1', primary_type: 'cafe', types: ['cafe', 'food'], query_subcategory_name: 'Café' }),
      expect.objectContaining({ google_place_id: 'the-1', primary_type: 'tea_house', query_subcategory_name: 'Salon de thé' }),
    ])
  })

  it('BR-03 : type refusé (400) → requête refaite en texte seul', async () => {
    const bodies: Array<Record<string, unknown>> = []
    global.fetch = jest.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      bodies.push(body)
      if (body.includedType) return { ok: false, status: 400, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => ({ places: [place('cafe-1', 'cafe')] }) }
    }) as jest.Mock

    const candidates = await searchGooglePlaceCandidates({ ...baseParams, typeQueries: [{ includedType: 'cafe_inconnu', query_subcategory_name: null }] })

    expect(bodies).toHaveLength(2)
    expect(bodies[1]).not.toHaveProperty('includedType')
    expect(candidates).toHaveLength(1)
  })

  it('autre erreur Google → propagée', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as jest.Mock
    await expect(searchGooglePlaceCandidates({ ...baseParams, typeQueries: [{ includedType: 'cafe', query_subcategory_name: null }] }))
      .rejects.toThrow('500')
  })

  it('AC-02-03 : sans type → recherche texte (catégorie + sous-catégories)', async () => {
    const bodies: Array<Record<string, unknown>> = []
    global.fetch = jest.fn(async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)))
      return { ok: true, status: 200, json: async () => ({ places: [] }) }
    }) as jest.Mock

    await searchGooglePlaceCandidates({ ...baseParams, typeQueries: [] })

    expect(bodies.map(body => body.textQuery)).toEqual([
      'Cafés Saint-Gervais-les-Bains', 'Café Saint-Gervais-les-Bains', 'Salon de thé Saint-Gervais-les-Bains',
    ])
    expect(bodies.every(body => !('includedType' in body))).toBe(true)
  })
})
