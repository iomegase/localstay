import {
  GOOGLE_REVIEW_TTL_DAYS,
  googleReviewExpiry,
  sanitizeGoogleReviewPayload,
} from '@/features/poi-acquisition/lib/google-policy'

describe('018 Google Places policy', () => {
  it('AC-05-01: keeps only place_id durable and prepares temporary admin review payload', () => {
    const sanitized = sanitizeGoogleReviewPayload({
      id: 'place-123',
      displayName: { text: 'Google Name' },
      formattedAddress: 'Google Address',
      rating: 4.8,
      regularOpeningHours: { weekdayDescriptions: ['Monday: 9 AM-5 PM'] },
    })

    expect(sanitized.google_place_id).toBe('place-123')
    expect(sanitized.review_payload).toEqual({
      displayName: { text: 'Google Name' },
      formattedAddress: 'Google Address',
      rating: 4.8,
      attribution: 'Google Maps',
    })
    expect(sanitized.review_payload).not.toHaveProperty('regularOpeningHours')
  })

  it('AC-05-02: expires temporary Google review payloads after a short TTL', () => {
    const now = new Date('2026-05-24T00:00:00.000Z')

    expect(GOOGLE_REVIEW_TTL_DAYS).toBe(30)
    expect(googleReviewExpiry(now).toISOString()).toBe('2026-06-23T00:00:00.000Z')
  })
})
