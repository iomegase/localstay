import {
  LodgingAmenityItemSchema,
  LodgingFaqItemSchema,
  LodgingPublicProfileInputSchema,
} from '@/features/lodging-showcase/schemas'

describe('amenity availability', () => {
  it('defaults availability to included', () => {
    const parsed = LodgingAmenityItemSchema.parse({ code: 'wifi', label: 'Wifi' })
    expect(parsed.availability).toBe('included')
  })

  it('accepts on_request', () => {
    const parsed = LodgingAmenityItemSchema.parse({ code: 'chef', label: 'Chef', availability: 'on_request' })
    expect(parsed.availability).toBe('on_request')
  })

  it('rejects unknown availability', () => {
    expect(() => LodgingAmenityItemSchema.parse({ code: 'x', label: 'X', availability: 'maybe' })).toThrow()
  })
})

describe('faq schema', () => {
  it('parses a valid faq item', () => {
    const parsed = LodgingFaqItemSchema.parse({ question: 'Heure arrivée ?', answer: 'À partir de 15h.' })
    expect(parsed.sort_order).toBe(0)
  })

  it('rejects too-short answers', () => {
    expect(() => LodgingFaqItemSchema.parse({ question: 'Quoi ?', answer: 'non' })).toThrow()
  })

  it('accepts faq array on profile input (empty allowed)', () => {
    const base = {
      title: 'Chalet Remy alpin',
      short_description: 'Un chalet chaleureux au cœur des montagnes pour vos vacances en famille.',
      description: 'x'.repeat(120),
      property_type: 'Chalet',
      max_guests: 6,
      public_contact_enabled: true,
      amenities: [],
      photos: [],
      faq: [],
    }
    expect(() => LodgingPublicProfileInputSchema.parse(base)).not.toThrow()
  })
})
