const mockGeocodeAddress = jest.fn()
const mockFindOsm = jest.fn()

jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))
jest.mock('@/features/geocoding/services/osm-name-geocoder', () => ({
  findOsmPlaceByName: (...args: unknown[]) => mockFindOsm(...args),
}))

import { geocodeForAcquisition } from '@/features/poi-acquisition/lib/geocode'
import { geocodeProvider } from '@/features/poi-acquisition/lib/geocode-provider'

const contamines = { latitude: 45.8214, longitude: 6.7272 }
// Centre du code postal 74170 (Saint-Gervais) : ce que Mapbox renvoyait pour la cascade.
const postcode = { latitude: 45.89227, longitude: 6.712007, relevance: 0.77, place_name: '74170, Saint-Gervais-les-Bains', place_type: 'postcode' }
const cascade = { latitude: 45.7800128, longitude: 6.7225317, osm_type: 'node', osm_id: 1 }

// Spec 101 US-01 — position par OpenStreetMap quand Mapbox ne trouve que le code postal.
describe('101 US-01 — geocodeForAcquisition + OpenStreetMap', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-01-01 : code postal seul → position OSM, succès, fournisseur openstreetmap', async () => {
    mockGeocodeAddress.mockResolvedValue(postcode)
    mockFindOsm.mockResolvedValue(cascade)

    const result = await geocodeForAcquisition('Cascade de Combe Noire, 74170 Les Contamines-Montjoie, France', contamines, { name: 'Cascade de Combe Noire' })

    expect(mockFindOsm).toHaveBeenCalledWith('Cascade de Combe Noire', contamines)
    expect(result).toEqual({ status: 'success', latitude: 45.7800128, longitude: 6.7225317, confidence: 1, provider: 'openstreetmap' })
    expect(geocodeProvider(result)).toBe('openstreetmap')
  })

  it('AC-01-01 : aucun résultat Mapbox → OSM consulté', async () => {
    mockGeocodeAddress.mockResolvedValue(null)
    mockFindOsm.mockResolvedValue(cascade)
    await expect(geocodeForAcquisition('Cascade', contamines, { name: 'Cascade de Combe Noire' })).resolves.toMatchObject({ status: 'success', provider: 'openstreetmap' })
  })

  it('AC-01-03 : rien dans OSM → position approximative « à vérifier » inchangée', async () => {
    mockGeocodeAddress.mockResolvedValue(postcode)
    mockFindOsm.mockResolvedValue(null)
    const result = await geocodeForAcquisition('Cascade', contamines, { name: 'Cascade de Combe Noire' })
    expect(result).toMatchObject({ status: 'pending_review', latitude: 45.89227 })
    expect(geocodeProvider(result)).toBe('mapbox')
  })

  it('une adresse précise de Mapbox ne consulte pas OSM', async () => {
    mockGeocodeAddress.mockResolvedValue({ latitude: 45.82, longitude: 6.72, relevance: 0.95, place_name: '29 Rte de Notre Dame de la Gorge', place_type: 'address' })
    const result = await geocodeForAcquisition('29 Rte de Notre Dame de la Gorge', contamines, { name: 'Aux Délices' })
    expect(mockFindOsm).not.toHaveBeenCalled()
    expect(result).toMatchObject({ status: 'success', provider: 'mapbox' })
  })

  it('sans nom, OSM n’est pas consulté', async () => {
    mockGeocodeAddress.mockResolvedValue(postcode)
    await geocodeForAcquisition('Cascade', contamines)
    expect(mockFindOsm).not.toHaveBeenCalled()
  })
})
