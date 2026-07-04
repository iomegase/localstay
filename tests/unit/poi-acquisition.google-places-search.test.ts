import { searchGooglePlaceCandidates } from '@/features/poi-acquisition/lib/google-places'

const originalEnv = process.env

describe('018 Google Places candidate search coverage', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, GOOGLE_PLACES_API_KEY: 'test-key' }
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('AC-01-02/BR-16: queries category, useful subcategories and official source, then dedupes by Google place id', async () => {
    const requestedBodies: Array<{
      textQuery: string
      locationBias?: { circle?: { radius?: number } }
    }> = []

    global.fetch = jest.fn(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { textQuery: string }
      requestedBodies.push(body)

      if (body.textQuery === 'Restaurant Les Contamines-Montjoie') {
        return Response.json({
          places: [
            googlePlace('place-serpolet', 'Restaurant - LE SERPOLET', 'https://example.com/serpolet'),
          ],
        })
      }

      if (body.textQuery === 'Restaurants Les Contamines-Montjoie') {
        return Response.json({
          places: [
            googlePlace('place-serpolet', 'Restaurant - LE SERPOLET', 'https://example.com/serpolet'),
          ],
        })
      }

      if (body.textQuery === 'Spa Les Contamines-Montjoie') {
        return Response.json({
          places: [
            googlePlace('place-biche', 'BICHE', 'http://www.biche-lescontamines.fr/'),
          ],
        })
      }

      if (body.textQuery === 'biche-lescontamines.fr') {
        return Response.json({
          places: [
            googlePlace('place-biche', 'BICHE', 'http://www.biche-lescontamines.fr/'),
          ],
        })
      }

      return Response.json({ places: [] })
    })

    const candidates = await searchGooglePlaceCandidates({
      cityName: 'Les Contamines-Montjoie',
      postalCode: '74170',
      categoryName: 'Restaurant',
      subcategoryNames: ['Restaurants', 'Spa', 'Ouvert maintenant'],
      sourceUrl: 'https://biche-lescontamines.fr/',
      latitude: 45.8217,
      longitude: 6.7272,
    })

    expect(requestedBodies.map(body => body.textQuery)).toEqual([
      'Restaurant Les Contamines-Montjoie',
      'Restaurants Les Contamines-Montjoie',
      'Spa Les Contamines-Montjoie',
      'biche-lescontamines.fr',
    ])
    expect(requestedBodies.map(body => body.textQuery).join(' ')).not.toContain('74170')
    expect(requestedBodies.every(body => body.locationBias?.circle?.radius === 30000)).toBe(true)
    expect(candidates.map(candidate => candidate.google_place_id)).toEqual(['place-serpolet', 'place-biche'])
    expect(candidates.find(candidate => candidate.google_place_id === 'place-biche')?.query_subcategory_name).toBe('Spa')
  })
})

function googlePlace(id: string, name: string, websiteUri: string) {
  return {
    id,
    displayName: { text: name },
    formattedAddress: '94 Chem. du Praz, 74170 Les Contamines-Montjoie, France',
    websiteUri,
    nationalPhoneNumber: '04 50 47 01 57',
    rating: 4.8,
    userRatingCount: 42,
  }
}
