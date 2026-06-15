import { blogListMetadata } from '@/features/blog/lib/metadata'

describe('029 blog list metadata', () => {
  it('builds canonical, title and description for /blog', () => {
    const metadata = blogListMetadata({ city: null })

    expect(metadata.title).toBe('Blog MyStay — Guides locaux et conseils de séjour')
    expect(metadata.alternates?.canonical).toBe('/blog')
    expect(metadata.description).toContain('guides locaux')
  })
})
