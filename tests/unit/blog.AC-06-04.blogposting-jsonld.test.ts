import { blogPostingSchema } from '@/features/blog/lib/structured-data'

describe('029 blog BlogPosting json-ld', () => {
  const realBase = process.env.NEXT_PUBLIC_BASE_URL

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.mystay.city'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.mystay.city'
  })

  afterAll(() => {
    if (realBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = realBase
  })

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
    expect(schema.mainEntityOfPage).toBe('https://www.mystay.city/blog/week-end-saint-gervais')
    expect(schema.author).toEqual({ '@id': 'https://www.mystay.city/#organization' })
    expect(schema.publisher).toEqual({ '@id': 'https://www.mystay.city/#organization' })
  })

  it('uses a preview article URL while keeping production Organization references', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://preview.mystay.vercel.app'

    const schema = blogPostingSchema({
      slug: 'article-preview',
      title: 'Article preview',
      excerpt: 'Extrait visible.',
      publishedAt: new Date('2026-06-15T10:00:00Z'),
      coverUrl: null,
      coverAlt: null,
      cityName: null,
    })

    expect(schema.mainEntityOfPage).toBe('https://preview.mystay.vercel.app/blog/article-preview')
    expect(schema.author).toEqual({ '@id': 'https://www.mystay.city/#organization' })
    expect(schema.publisher).toEqual({ '@id': 'https://www.mystay.city/#organization' })
  })
})
