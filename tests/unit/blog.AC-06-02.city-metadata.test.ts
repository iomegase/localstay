import { blogListMetadata } from '@/features/blog/lib/metadata'

describe('029 blog city metadata', () => {
  it('contextualizes the title for a city filter while keeping the canonical on /blog', () => {
    const metadata = blogListMetadata({
      city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    })

    expect(metadata.title).toBe('Blog Saint-Gervais-les-Bains — Guides locaux MyStay')
    expect(metadata.alternates?.canonical).toBe('/blog')
  })
})
