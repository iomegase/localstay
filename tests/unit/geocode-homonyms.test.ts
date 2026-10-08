import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import { geocodeForAcquisition } from '@/features/poi-acquisition/lib/geocode'

// Incident 2026-10-08 : « 745 Chem. de Font Froide, 74170 Saint-Gervais » géocodé en Isère (128 km).
const saintGervais = { latitude: 45.89227, longitude: 6.712007 }
const feature = (lng: number, lat: number, type: string, name: string, relevance = 0.9) => ({ center: [lng, lat], relevance, place_name: name, place_type: [type] })
const isere = feature(5.194055, 45.434554, 'address', '745 Chemin De Font Froide, 38260 Porte-des-Bonnevaux')
const commune = feature(6.712007, 45.89227, 'place', 'Saint-Gervais-les-Bains, Haute-Savoie, France', 0.66)

describe('géocodage Mapbox — homonymes hors zone', () => {
  const env = process.env
  let fetchMock: jest.Mock
  beforeEach(() => {
    process.env = { ...env, NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test' }
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })
  afterAll(() => { process.env = env })

  it('préfère le premier résultat dans la zone parmi les 5 premiers', async () => {
    const local = feature(6.7111, 45.8923, 'address', '31 Avenue du Mont Paccard, Saint-Gervais')
    fetchMock.mockResolvedValue(Response.json({ features: [isere, local] }))
    const result = await geocodeAddress('adresse', saintGervais, { preferWithinKm: 30 })
    expect(result?.place_name).toContain('Mont Paccard')
    expect(String(fetchMock.mock.calls[0][0])).toContain('limit=5')
  })

  it('rue inconnue : nouvelle recherche limitée à 30 km → commune seule = « à vérifier », jamais rejeté ni réussi', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ features: [isere] }))
      .mockResolvedValueOnce(Response.json({ features: [commune] }))
    const result = await geocodeForAcquisition('745 Chem. de Font Froide, 74170 Saint-Gervais-les-Bains', saintGervais)
    expect(result).toMatchObject({ status: 'pending_review', latitude: 45.89227, longitude: 6.712007 })
    expect(result.status === 'pending_review' && result.reason).toContain('Position approximative')
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/&bbox=6\.32[0-9]*,45\.62[0-9]*,7\.10[0-9]*,46\.16[0-9]*/)
  })

  it('aucun résultat dans la zone même en recherche locale : rejeté', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ features: [isere] }))
      .mockResolvedValueOnce(Response.json({ features: [] }))
    await expect(geocodeForAcquisition('adresse lointaine', saintGervais)).resolves.toMatchObject({ status: 'rejected' })
  })

  it('adresse précise dans la zone : réussi', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ features: [feature(6.7111, 45.8923, 'address', '31 Avenue du Mont Paccard')] }))
    await expect(geocodeForAcquisition('31 Av. du Mont Paccard', saintGervais)).resolves.toMatchObject({ status: 'success' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('autres usages (villes, logements) inchangés : un seul résultat, sans zone', async () => {
    fetchMock.mockResolvedValue(Response.json({ features: [isere] }))
    await geocodeAddress('Combloux 74920 France', { latitude: 46.6, longitude: 2.4 })
    expect(String(fetchMock.mock.calls[0][0])).toContain('limit=1')
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('bbox=')
  })
})
