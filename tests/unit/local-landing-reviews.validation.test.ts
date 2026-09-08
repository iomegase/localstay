import { LandingReviewInputSchema } from '@/features/local-seo/schemas/landing-reviews'

const valid = {
  destination_slug: 'saint-gervais-les-bains',
  author: 'Marie',
  quote: 'Un séjour parfaitement accompagné par MyStay.',
  stay_date: 'Août 2026',
  source: 'DIRECT',
  rating: 5,
  sort_order: 0,
}

describe('047 landing review validation', () => {
  it('accepts a complete review for a catalog destination', () => {
    expect(LandingReviewInputSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    { ...valid, destination_slug: 'unknown' },
    { ...valid, rating: 6 },
    { ...valid, quote: 'Court' },
  ])('rejects invalid public data', input => {
    expect(LandingReviewInputSchema.safeParse(input).success).toBe(false)
  })
})
