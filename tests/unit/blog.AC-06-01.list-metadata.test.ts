import { blogListMetadata } from '@/features/blog/lib/metadata'

describe('029 blog list metadata', () => {
  it('builds canonical, title and description for /blog', () => {
    const metadata = blogListMetadata({ city: null })

    expect(metadata.title).toBe('Journal — Guides locaux et conseils de séjour')
    expect(metadata.alternates?.canonical).toBe('/journal')
    expect(metadata.description).toContain('guides locaux')
  })
})
