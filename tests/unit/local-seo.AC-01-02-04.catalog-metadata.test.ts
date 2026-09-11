import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'
import { publicLocalLanding } from '../fixtures/public-local-landing'

describe('046 local SEO metadata with persisted content under spec 048', () => {
  it('builds intent-specific paths and indexable local metadata', () => {
    const destination = { id: 'city-1', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' }

    expect(localSeoPath('concierge', destination.slug)).toBe(
      '/conciergerie/saint-gervais-les-bains',
    )
    expect(localSeoPath('seminar', destination.slug)).toBe(
      '/seminaires/saint-gervais-les-bains',
    )
    expect(localSeoPath('vacation-rental', destination.slug)).toBe(
      '/locations-vacances/saint-gervais-les-bains',
    )

    const landing = publicLocalLanding('CONCIERGE', { id: 'city-1', name: destination.name, slug: destination.slug })
    const metadata = localSeoMetadata(landing, 'concierge')
    expect(metadata.title).toEqual({ absolute: landing.page.seo_title })
    expect(metadata.description).toContain('Saint-Gervais-les-Bains')
    expect(metadata.alternates?.canonical).toBe('/conciergerie/saint-gervais-les-bains')
    expect(metadata.openGraph).toEqual(expect.objectContaining({
      title: landing.page.seo_title,
      url: '/conciergerie/saint-gervais-les-bains',
    }))
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })

  it('indexes persisted published rental destinations under spec 048', () => {
    const landing = publicLocalLanding('VACATION_RENTAL')
    const metadata = localSeoMetadata(landing, 'vacation-rental')
    expect(metadata.title).toEqual({ absolute: landing.page.seo_title })
    expect(metadata.alternates?.canonical).toBe('/locations-vacances/megeve')
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })

  it.each(['megeve', 'combloux'])('uses saved metadata when %s is published', slug => {
    const landing = publicLocalLanding('CONCIERGE', { id: `city-${slug}`, slug, name: slug })
    landing.page.seo_title = `Titre édité pour ${slug}`
    landing.page.meta_description = `Description éditée pour ${slug}`
    const metadata = localSeoMetadata(landing, 'concierge')
    expect(metadata.title).toEqual({ absolute: landing.page.seo_title })
    expect(metadata.description).toBe(landing.page.meta_description)
    expect(metadata.alternates?.canonical).toBe(`/conciergerie/${slug}`)
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
