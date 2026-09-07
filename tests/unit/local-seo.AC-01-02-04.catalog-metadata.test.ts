import {
  getLocalSeoDestination,
  localSeoDestinations,
  listPublishedServiceDestinations,
} from '@/features/local-seo/content/destinations'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'

describe('046 local SEO destination catalogue and metadata', () => {
  it('contains exactly the four approved destinations', () => {
    expect(localSeoDestinations.map(destination => destination.slug)).toEqual([
      'saint-gervais-les-bains',
      'saint-nicolas-de-veroce',
      'megeve',
      'combloux',
    ])
  })

  it.each(['concierge', 'seminar'] as const)(
    'publishes %s only in the two active service areas',
    intent => {
      expect(listPublishedServiceDestinations(intent).map(destination => destination.slug)).toEqual([
        'saint-gervais-les-bains',
        'saint-nicolas-de-veroce',
      ])
      expect(getLocalSeoDestination('megeve')?.services[intent].published).toBe(false)
      expect(getLocalSeoDestination('combloux')?.services[intent].published).toBe(false)
    },
  )

  it('builds intent-specific paths and indexable local metadata', () => {
    const destination = getLocalSeoDestination('saint-gervais-les-bains')
    expect(destination).not.toBeNull()
    if (!destination) return

    expect(localSeoPath('concierge', destination.slug)).toBe(
      '/conciergerie/saint-gervais-les-bains',
    )
    expect(localSeoPath('seminar', destination.slug)).toBe(
      '/seminaires/saint-gervais-les-bains',
    )
    expect(localSeoPath('vacation-rental', destination.slug)).toBe(
      '/locations-vacances/saint-gervais-les-bains',
    )

    const metadata = localSeoMetadata(destination, 'concierge', true)
    expect(metadata.title).toBe('Conciergerie à Saint-Gervais-les-Bains')
    expect(metadata.description).toContain('Saint-Gervais-les-Bains')
    expect(metadata.alternates?.canonical).toBe('/conciergerie/saint-gervais-les-bains')
    expect(metadata.openGraph).toEqual(expect.objectContaining({
      title: 'Conciergerie à Saint-Gervais-les-Bains | MyStay',
      url: '/conciergerie/saint-gervais-les-bains',
    }))
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })

  it('keeps known empty rental destinations accessible but noindex, follow', () => {
    const destination = getLocalSeoDestination('megeve')
    expect(destination).not.toBeNull()
    if (!destination) return

    const metadata = localSeoMetadata(destination, 'vacation-rental', false)
    expect(metadata.title).toBe('Locations de vacances à Megève')
    expect(metadata.alternates?.canonical).toBe('/locations-vacances/megeve')
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })

  it('uses unique principal copy for every city and intent', () => {
    const copy = localSeoDestinations.flatMap(destination => [
      destination.services.concierge.intro,
      destination.services.seminar.intro,
      destination.services.vacationRental.intro,
    ])

    expect(new Set(copy).size).toBe(copy.length)
  })
})
