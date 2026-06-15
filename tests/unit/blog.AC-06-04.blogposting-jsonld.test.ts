import { blogPostingSchema } from '@/features/blog/lib/structured-data'

describe('029 blog BlogPosting json-ld', () => {
  it('emits a BlogPosting matching the visible article fields', () => {
    const schema = blogPostingSchema({
      slug: 'week-end-saint-gervais',
      title: 'Week-end à Saint-Gervais',
      excerpt: 'Préparez un week-end local avec une sélection utile et lisible.',
      publishedAt: new Date('2026-06-15T10:00:00Z'),
      coverUrl: 'https://img.test/cover.jpg',
      coverAlt: 'Saint-Gervais en été',
      cityName: 'Saint-Gervais-les-Bains',
    })

    expect(schema['@type']).toBe('BlogPosting')
    expect(schema.headline).toBe('Week-end à Saint-Gervais')
    expect(schema.image).toEqual(['https://img.test/cover.jpg'])
    expect(schema.mainEntityOfPage).toBe('http://localhost:3000/blog/week-end-saint-gervais')
  })
})
