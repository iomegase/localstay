import {
  deriveAmenityOptions,
  deriveCityOptions,
  filterLodgings,
  isFilterActive,
  lodgingMatchesAmenity,
  type LodgingFilterInput,
  type LodgingFilterState,
} from '@/features/lodging-showcase/lib/lodging-filters'

const lodgings: LodgingFilterInput[] = [
  { city_name: 'Chamonix', max_guests: 8, amenities: ['Jacuzzi extérieur', 'Wifi'] },
  { city_name: 'Saint-Gervais-les-Bains', max_guests: 4, amenities: ['Piscine chauffée'] },
  { city_name: 'Chamonix', max_guests: 2, amenities: ['Bain à remous', 'Hammam privatif'] },
  { city_name: 'Annecy', max_guests: 6, amenities: ['Cheminée'] },
]

const state = (partial: Partial<LodgingFilterState>): LodgingFilterState => ({
  city: null,
  minGuests: null,
  amenities: [],
  ...partial,
})

describe('lodging-filters', () => {
  it('matches amenities by normalized keyword (accents/case/synonyms)', () => {
    expect(lodgingMatchesAmenity(['Jacuzzi extérieur'], 'jacuzzi')).toBe(true)
    expect(lodgingMatchesAmenity(['Bain à remous'], 'jacuzzi')).toBe(true)
    expect(lodgingMatchesAmenity(['PISCINE chauffée'], 'piscine')).toBe(true)
    expect(lodgingMatchesAmenity(['Hammam privatif'], 'hammam')).toBe(true)
    expect(lodgingMatchesAmenity(['Cheminée'], 'piscine')).toBe(false)
  })

  it('filters by city', () => {
    const result = filterLodgings(lodgings, state({ city: 'Chamonix' }))
    expect(result).toHaveLength(2)
    expect(result.every(l => l.city_name === 'Chamonix')).toBe(true)
  })

  it('filters by minimum number of couchages', () => {
    const result = filterLodgings(lodgings, state({ minGuests: 6 }))
    expect(result.map(l => l.max_guests).sort()).toEqual([6, 8])
  })

  it('requires all selected amenities to be present', () => {
    const result = filterLodgings(lodgings, state({ amenities: ['jacuzzi', 'hammam'] }))
    expect(result).toHaveLength(1)
    expect(result[0].city_name).toBe('Chamonix')
    expect(result[0].max_guests).toBe(2)
  })

  it('combines city, couchages and amenities', () => {
    const result = filterLodgings(lodgings, state({ city: 'Chamonix', minGuests: 4, amenities: ['jacuzzi'] }))
    expect(result).toHaveLength(1)
    expect(result[0].max_guests).toBe(8)
  })

  it('derives distinct sorted city options', () => {
    expect(deriveCityOptions(lodgings)).toEqual(['Annecy', 'Chamonix', 'Saint-Gervais-les-Bains'])
  })

  it('only exposes amenity filters that exist in the selection', () => {
    const only = deriveAmenityOptions([{ city_name: 'X', max_guests: 2, amenities: ['Wifi'] }])
    expect(only).toHaveLength(0)
    const some = deriveAmenityOptions(lodgings).map(a => a.id)
    expect(some).toEqual(['jacuzzi', 'piscine', 'hammam'])
  })

  it('reports active state', () => {
    expect(isFilterActive(state({}))).toBe(false)
    expect(isFilterActive(state({ city: 'Chamonix' }))).toBe(true)
    expect(isFilterActive(state({ amenities: ['piscine'] }))).toBe(true)
  })
})
