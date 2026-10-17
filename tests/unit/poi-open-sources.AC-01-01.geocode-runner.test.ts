const mockPoiFindMany = jest.fn()
const mockPoiUpdate = jest.fn()
const mockGeocodeAddress = jest.fn()
const mockFindOsm = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) } },
}))
jest.mock('@/features/public-discovery/queries/mutation-reconciliation', () => ({
  runPoiMutationWithDiscoveryReconciliation: async ({ mutate }: { mutate: (tx: unknown) => Promise<unknown> }) => {
    await mutate({ pointOfInterest: { update: (...args: unknown[]) => mockPoiUpdate(...args) } })
    return { discoveryRevalidationPaths: [] }
  },
}))
jest.mock('@/features/public-discovery/lib/revalidation', () => ({ safelyRevalidateDiscoveryPaths: jest.fn() }))
jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))
jest.mock('@/features/geocoding/services/osm-name-geocoder', () => ({
  findOsmPlaceByName: (...args: unknown[]) => mockFindOsm(...args),
}))

import { runGeocodeBatch } from '@/features/geocoding/services/geocode-runner'

const contamines = { latitude: 45.8214, longitude: 6.7272 }
const poi = { id: 'poi-1', name: 'Cascade de Combe Noire', address: 'Cascade de Combe Noire, 74170 Les Contamines-Montjoie', city: contamines }

// Spec 101 AC-01-01 — tâche nocturne : code postal seul → position OpenStreetMap.
describe('101 AC-01-01 — runGeocodeBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindMany.mockResolvedValue([poi])
    mockPoiUpdate.mockResolvedValue({ id: 'poi-1' })
  })

  it('remplace le centre du code postal par la position OSM, fournisseur openstreetmap', async () => {
    mockGeocodeAddress.mockResolvedValue({ latitude: 45.89227, longitude: 6.712007, relevance: 0.77, place_name: '74170', place_type: 'postcode' })
    mockFindOsm.mockResolvedValue({ latitude: 45.7800128, longitude: 6.7225317, osm_type: 'node', osm_id: 1 })

    await expect(runGeocodeBatch({})).resolves.toMatchObject({ geocoded: 1 })
    expect(mockFindOsm).toHaveBeenCalledWith('Cascade de Combe Noire', contamines)
    expect(mockPoiUpdate.mock.calls[0][0].data).toMatchObject({
      latitude: 45.7800128, longitude: 6.7225317, geocode_status: 'success', geocode_provider: 'openstreetmap',
    })
  })

  it('adresse précise de Mapbox : OSM non consulté, fournisseur mapbox', async () => {
    mockGeocodeAddress.mockResolvedValue({ latitude: 45.8215, longitude: 6.7271, relevance: 0.95, place_name: '29 Rte', place_type: 'address' })
    await runGeocodeBatch({})
    expect(mockFindOsm).not.toHaveBeenCalled()
    expect(mockPoiUpdate.mock.calls[0][0].data).toMatchObject({ geocode_provider: 'mapbox' })
  })
})
