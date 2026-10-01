import { LodgingPhotoCategoryInputSchema } from '@/features/lodging-showcase/schemas'
import { buildPhotoCategoryOptions, parsePhotoCategoryValue } from '@/features/lodging-showcase/lib/photo-categories'

describe('buildPhotoCategoryOptions', () => {
  it('numbers bedrooms when count >= 2', () => {
    const opts = buildPhotoCategoryOptions(3, 0)
    const bedrooms = opts.filter(o => o.roomType === 'bedroom')
    expect(bedrooms.map(o => o.label)).toEqual(['Chambre 1', 'Chambre 2', 'Chambre 3'])
    expect(bedrooms[1]).toMatchObject({ value: 'bedroom::Chambre 2', roomLabel: 'Chambre 2' })
  })

  it('uses a single generic bedroom option when count <= 1', () => {
    const opts = buildPhotoCategoryOptions(1, 0)
    const bedrooms = opts.filter(o => o.roomType === 'bedroom')
    expect(bedrooms).toHaveLength(1)
    expect(bedrooms[0]).toMatchObject({ value: 'bedroom', label: 'Chambre', roomLabel: null })
  })

  it('numbers bathrooms by ceil of the count', () => {
    const opts = buildPhotoCategoryOptions(0, 1.5)
    const baths = opts.filter(o => o.roomType === 'bathroom')
    expect(baths.map(o => o.label)).toEqual(['Salle de bains 1', 'Salle de bains 2'])
  })

  it('single generic bathroom when count <= 1', () => {
    const opts = buildPhotoCategoryOptions(0, 1)
    const baths = opts.filter(o => o.roomType === 'bathroom')
    expect(baths).toHaveLength(1)
    expect(baths[0]).toMatchObject({ value: 'bathroom', roomLabel: null })
  })

  it('always includes the fixed generic categories', () => {
    const opts = buildPhotoCategoryOptions(0, 0)
    expect(opts.map(o => o.roomType)).toEqual(
      expect.arrayContaining(['bedroom', 'bathroom', 'common_area', 'exterior', 'kitchen', 'other']),
    )
    expect(opts.find(o => o.roomType === 'common_area')).toMatchObject({ value: 'common_area', label: 'Pièce de vie', roomLabel: null })
  })

  it('handles null counts as zero', () => {
    expect(() => buildPhotoCategoryOptions(null, null)).not.toThrow()
  })
})

describe('parsePhotoCategoryValue', () => {
  it('splits roomType::label', () => {
    expect(parsePhotoCategoryValue('bedroom::Chambre 2')).toEqual({ roomType: 'bedroom', roomLabel: 'Chambre 2' })
  })
  it('returns null label for a plain value', () => {
    expect(parsePhotoCategoryValue('common_area')).toEqual({ roomType: 'common_area', roomLabel: null })
  })
})


describe('AC-05-15: room choices', () => {
  it('supports ten distinct bedrooms and the Salon and Salle de bains categories', () => {
    const options = buildPhotoCategoryOptions(10, 1)
    expect(options.filter(option => option.roomType === 'bedroom')).toHaveLength(10)
    expect(options).toContainEqual({ value: 'bedroom::Chambre 10', label: 'Chambre 10', roomType: 'bedroom', roomLabel: 'Chambre 10' })
    expect(options).toContainEqual({ value: 'common_area::Salon', label: 'Salon', roomType: 'common_area', roomLabel: 'Salon' })
    expect(options).toContainEqual({ value: 'bathroom', label: 'Salle de bains', roomType: 'bathroom', roomLabel: null })
    for (const label of ['Terrasse', 'Piscine', 'Hammam', 'Jacuzzi', 'Cinéma', 'Salle à manger', 'Bowling', 'Parking', 'Skiroom', 'Sauna', 'Salle de sport', 'Bibliothèque', 'Entrée', 'Garage']) {
      const option = options.find(item => item.label === label)
      expect(option).toBeDefined()
      const category = parsePhotoCategoryValue(option!.value)
      expect(category.roomLabel).toBe(label)
      expect(LodgingPhotoCategoryInputSchema.safeParse({ room_type: category.roomType, room_label: category.roomLabel }).success).toBe(true)
    }
    expect(new Set(options.map(option => option.value)).size).toBe(options.length)
  })
})
