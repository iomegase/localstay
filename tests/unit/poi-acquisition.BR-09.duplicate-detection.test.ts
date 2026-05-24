import { findProbableDuplicates, normalizePoiIdentity } from '@/features/poi-acquisition/lib/duplicate-detection'

describe('018 duplicate detection', () => {
  it('BR-09: normalizes POI names and addresses accent-insensitively', () => {
    expect(normalizePoiIdentity('Brasserie du Mont-Blanc')).toBe('brasserie mont blanc')
    expect(normalizePoiIdentity('31 Avenue du Mont Paccard')).toBe('31 avenue mont paccard')
  })

  it('BR-09/BR-10: flags duplicates by google_place_id, normalized name/address or close coordinates', () => {
    const duplicates = findProbableDuplicates(
      {
        name: 'Brasserie du Mont Blanc',
        address: '31 Avenue du Mont Paccard',
        latitude: 45.89233,
        longitude: 6.71115,
        google_place_id: 'google-1',
      },
      [
        {
          id: 'poi-google',
          name: 'Autre nom',
          address: 'Adresse',
          latitude: 45,
          longitude: 6,
          google_place_id: 'google-1',
        },
        {
          id: 'poi-name-address',
          name: 'Brasserie Mont Blanc',
          address: '31 Av. du Mont Paccard',
          latitude: 45,
          longitude: 6,
          google_place_id: null,
        },
        {
          id: 'poi-nearby',
          name: 'Brasserie du Mont Blanc',
          address: 'Rue voisine',
          latitude: 45.89234,
          longitude: 6.71116,
          google_place_id: null,
        },
      ],
    )

    expect(duplicates.map(duplicate => duplicate.id)).toEqual(['poi-google', 'poi-name-address', 'poi-nearby'])
  })
})
