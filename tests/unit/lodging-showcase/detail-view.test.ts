import { selectRoomPhotos, mapsDirectionUrl, ROOM_TYPE_LABELS } from '@/features/lodging-showcase/lib/detail-view'

describe('selectRoomPhotos', () => {
  const photos = [
    { id: '1', url: 'a', alt: 'A', room_type: 'bedroom', sort_order: 0, is_cover: true },
    { id: '2', url: 'b', alt: 'B', room_type: null, sort_order: 1, is_cover: false },
    { id: '3', url: 'c', alt: 'C', room_type: 'kitchen', sort_order: 2, is_cover: false },
  ]

  it('keeps only photos with a known room type and labels them', () => {
    const result = selectRoomPhotos(photos)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ url: 'a', label: 'Chambre' })
    expect(result[1]).toMatchObject({ url: 'c', label: 'Cuisine' })
  })

  it('ignores the "other" room type', () => {
    expect(selectRoomPhotos([{ id: '4', url: 'd', alt: 'D', room_type: 'other', sort_order: 0, is_cover: false }])).toHaveLength(0)
  })

  it('uses the specific room_label when present', () => {
    const result = selectRoomPhotos([
      { id: '5', url: 'e', alt: 'E', room_type: 'bedroom', room_label: 'Chambre 2', sort_order: 0, is_cover: false },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ url: 'e', label: 'Chambre 2' })
  })

  it('falls back to the generic label when room_label is absent', () => {
    const result = selectRoomPhotos([
      { id: '6', url: 'f', alt: 'F', room_type: 'bedroom', room_label: null, sort_order: 0, is_cover: false },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ url: 'f', label: 'Chambre' })
  })
})

describe('mapsDirectionUrl', () => {
  it('builds a google maps directions url', () => {
    expect(mapsDirectionUrl(45.9, 6.86)).toBe('https://www.google.com/maps/dir/?api=1&destination=45.9,6.86')
  })
})

describe('ROOM_TYPE_LABELS', () => {
  it('maps every enum value', () => {
    expect(Object.keys(ROOM_TYPE_LABELS)).toEqual(
      expect.arrayContaining(['bedroom', 'bathroom', 'common_area', 'exterior', 'kitchen', 'other']),
    )
  })
})
