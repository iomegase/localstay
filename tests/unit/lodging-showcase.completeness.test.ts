import { canEmitVacationRentalSchema, evaluateProfileCompleteness } from '../../src/features/lodging-showcase/lib/completeness'

const baseProfile = {
  title: 'Chalet des Alpes',
  short_description: 'Un chalet lumineux proche du guide local MyStay.',
  description: 'Un logement confortable pour profiter de la destination avec des recommandations locales.',
  property_type: 'Chalet',
  max_guests: 4,
  photos: [{ url: 'https://img.test/cover.webp', alt: 'Salon du chalet', is_cover: true, room_type: 'common_area' }],
  amenities: [{ code: 'wifi', label: 'Wi-Fi' }, { code: 'kitchen', label: 'Cuisine' }, { code: 'parking', label: 'Parking' }],
  content_rights_confirmed_at: new Date('2026-06-12'),
}

describe('lodging profile completeness', () => {
  it('allows review when required fields are present', () => {
    expect(evaluateProfileCompleteness(baseProfile).canSubmitForReview).toBe(true)
  })

  it('allows review with a description between 80 and 199 characters', () => {
    expect(baseProfile.description.length).toBeGreaterThanOrEqual(80)
    expect(baseProfile.description.length).toBeLessThan(200)
    expect(evaluateProfileCompleteness(baseProfile).missingFields).not.toContain('description')
  })

  it('requires rights confirmation for review', () => {
    expect(evaluateProfileCompleteness({ ...baseProfile, content_rights_confirmed_at: null }).missingFields).toContain('content_rights_confirmation')
  })

  it('requires eight room-classified photos and public coordinates for VacationRental JSON-LD', () => {
    expect(canEmitVacationRentalSchema({
      ...baseProfile,
      photos: [],
      precise_location_public: false,
      public_latitude: null,
      public_longitude: null,
    })).toBe(false)
  })
})
