import { LodgingPublicProfileInputSchema } from '@/features/lodging-showcase/schemas'
import { evaluateProfileCompleteness } from '@/features/lodging-showcase/lib/completeness'

const schema = LodgingPublicProfileInputSchema.shape.short_description
const profile = {
  title: 'Chalet des Alpes', description: 'Un logement confortable. '.repeat(10),
  property_type: 'Chalet', max_guests: 4,
  photos: [{ url: 'https://example.com/photo.jpg', alt: 'Salon', is_cover: true }],
  amenities: ['wifi', 'parking', 'kitchen'].map(code => ({ code, label: code })),
  content_rights_confirmed_at: new Date(),
}

describe('AC-05-18 — description courte sans limites éditoriales', () => {
  it.each(['A', '**Chalet** cosy', '- Vue montagne\n- Terrasse\n'.repeat(1000)])('accepts and preserves nonempty text (%#)', short_description => {
    expect(schema.parse(short_description)).toBe(short_description.trim())
    expect(evaluateProfileCompleteness({ ...profile, short_description }).canSubmitForReview).toBe(true)
  })
  it.each(['', ' \n '])('still requires a description (%#)', short_description => {
    expect(schema.safeParse(short_description).success).toBe(false)
    expect(evaluateProfileCompleteness({ ...profile, short_description }).missingFields).toContain('short_description')
  })
})
