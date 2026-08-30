import {
  groupRoomPhotos,
  mapsDirectionUrl,
  ROOM_TYPE_LABELS,
  selectLodgingGalleryPhotos,
  selectRoomPhotos,
  selectVisibleLodgingPhotos,
} from '@/features/lodging-showcase/lib/detail-view'

describe('public lodging photo visibility', () => {
  const photos = [
    { url: 'first', room_type: null },
    { url: 'second', room_type: 'other' },
    { url: 'third', room_type: null },
    { url: 'hidden-null', room_type: null },
    { url: 'hidden-other', room_type: 'other' },
    { url: 'visible-room', room_type: 'kitchen' },
  ]

  it('shares the three-photo gallery limit with the public gallery', () => {
    expect(selectLodgingGalleryPhotos(photos).map(photo => photo.url)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('adds only later photos rendered by the room grid to the visible subset', () => {
    expect(selectVisibleLodgingPhotos(photos).map(photo => photo.url)).toEqual([
      'first',
      'second',
      'third',
      'visible-room',
    ])
  })
})

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

describe('groupRoomPhotos', () => {
  it('groups several photos that share a label into one entry, preserving order', () => {
    const groups = groupRoomPhotos([
      { id: '1', url: 'living', alt: 'Salon', room_type: 'common_area', sort_order: 0, is_cover: true },
      { id: '2', url: 'ext1', alt: 'Terrasse', room_type: 'exterior', sort_order: 1, is_cover: false },
      { id: '3', url: 'ext2', alt: 'Piscine', room_type: 'exterior', sort_order: 2, is_cover: false },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ label: 'Pièce de vie' })
    expect(groups[0].photos).toHaveLength(1)
    expect(groups[1].label).toBe('Extérieur')
    expect(groups[1].photos.map(p => p.url)).toEqual(['ext1', 'ext2'])
  })

  it('keeps distinct numbered rooms separate', () => {
    const groups = groupRoomPhotos([
      { id: '1', url: 'c1', alt: 'Chambre 1', room_type: 'bedroom', room_label: 'Chambre 1', sort_order: 0, is_cover: false },
      { id: '2', url: 'c2', alt: 'Chambre 2', room_type: 'bedroom', room_label: 'Chambre 2', sort_order: 1, is_cover: false },
    ])

    expect(groups.map(g => g.label)).toEqual(['Chambre 1', 'Chambre 2'])
    expect(groups.every(g => g.photos.length === 1)).toBe(true)
  })

  it('returns an empty array when no photo has a known room type', () => {
    expect(groupRoomPhotos([{ id: '1', url: 'x', alt: 'X', room_type: null, sort_order: 0, is_cover: false }])).toEqual([])
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
