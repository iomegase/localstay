/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import type { DiscoveryIndexCity, DiscoveryPoiCard } from '@/features/public-discovery/types'
import { getDiscoveryIndex } from '@/features/public-discovery/queries/public-discovery'

jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryIndex: jest.fn(),
}))

const mockedGetDiscoveryIndex = jest.mocked(getDiscoveryIndex)

const poi: DiscoveryPoiCard = {
  name: 'Atelier des Cimes',
  slug: 'atelier-des-cimes',
  address: '1 rue des Cimes',
  latitude: 45.9,
  longitude: 6.7,
  rating: 4.8,
  rating_count: 24,
  is_open_now: true,
  photo_url: 'https://images.example.com/atelier.jpg',
  category: { name: 'Artisanat', slug: 'artisanat' },
  subcategory: null,
  distance_km: 0.4,
  zone: 'primary',
}

const cities: DiscoveryIndexCity[] = [
  {
    name: 'Annecy',
    slug: 'annecy',
    postal_code: '74000',
    department: 'Haute-Savoie',
    region: 'Auvergne-Rhône-Alpes',
    pois: Array.from({ length: 5 }, (_, index) => ({
      ...poi,
      name: `Adresse Annecy ${index + 1}`,
      slug: `adresse-annecy-${index + 1}`,
    })),
  },
  {
    name: 'Biarritz',
    slug: 'biarritz',
    postal_code: '64200',
    department: 'Pyrénées-Atlantiques',
    region: 'Nouvelle-Aquitaine',
    pois: [{
      ...poi,
      name: 'Maison Biarrote',
      slug: 'maison-biarrote',
      category: { name: 'Culture', slug: 'culture' },
    }],
  },
]

function jsonLd(container: HTMLElement): Array<Record<string, unknown>> {
  return [...container.querySelectorAll('script[type="application/ld+json"]')]
    .map(script => JSON.parse(script.textContent ?? '{}') as Record<string, unknown>)
}

describe('041 AC-06 public discovery index page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders only the public city DTO in query order with canonical city and POI links', async () => {
    mockedGetDiscoveryIndex.mockResolvedValue(cities)
    const { default: DiscoveryIndexPage } = await import('@/app/(public)/decouvrir/page')

    const { container } = render(await DiscoveryIndexPage())

    expect(mockedGetDiscoveryIndex).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Découvrir les bonnes adresses locales.',
    })).toBeInTheDocument()
    expect(screen.getByTestId('marketing-stage')).toBeInTheDocument()
    expect(screen.getByTestId('marketing-surface')).toBeInTheDocument()

    const cityHeadings = [...container.querySelectorAll('[data-city-slug] h2')]
      .map(heading => heading.textContent)
    expect(cityHeadings).toEqual(['Annecy', 'Biarritz'])
    expect(screen.getByRole('link', { name: 'Découvrir Annecy' })).toHaveAttribute('href', '/decouvrir/annecy')
    expect(screen.getByRole('link', { name: 'Découvrir Biarritz' })).toHaveAttribute('href', '/decouvrir/biarritz')
    expect(screen.getByRole('link', { name: 'Découvrir Adresse Annecy 1' })).toHaveAttribute(
      'href',
      '/decouvrir/annecy/artisanat/adresse-annecy-1',
    )
    expect(screen.getByRole('link', { name: 'Découvrir Maison Biarrote' })).toHaveAttribute(
      'href',
      '/decouvrir/biarritz/culture/maison-biarrote',
    )
    expect(container.querySelectorAll('[data-city-slug="annecy"] article')).toHaveLength(5)
    expect(container.querySelectorAll('[data-city-slug="biarritz"] article')).toHaveLength(1)

    const hrefs = [...container.querySelectorAll('a')].map(link => link.getAttribute('href'))
    expect(hrefs.some(href => href?.startsWith('/guide/'))).toBe(false)
    expect(container.querySelector('[data-testid="bottom-navigation"]')).toBeNull()
    expect(container.textContent).not.toMatch(/lodging|owner|recommandation de votre hôte/i)
  })

  it('emits ordered city-only breadcrumbs and item-list JSON-LD from the rendered DTO', async () => {
    mockedGetDiscoveryIndex.mockResolvedValue(cities)
    const { default: DiscoveryIndexPage } = await import('@/app/(public)/decouvrir/page')

    const { container } = render(await DiscoveryIndexPage())

    expect(jsonLd(container)).toEqual([
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://www.mystay.city/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Découvrir',
            item: 'https://www.mystay.city/decouvrir',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Villes et bonnes adresses MyStay',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Annecy',
            url: 'https://www.mystay.city/decouvrir/annecy',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Biarritz',
            url: 'https://www.mystay.city/decouvrir/biarritz',
          },
        ],
      },
    ])
  })

  it('keeps the exact editorial empty state inside the marketing shell', async () => {
    mockedGetDiscoveryIndex.mockResolvedValue([])
    const { default: DiscoveryIndexPage } = await import('@/app/(public)/decouvrir/page')

    const { container } = render(await DiscoveryIndexPage())

    expect(mockedGetDiscoveryIndex).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Découvrir les bonnes adresses locales.',
    })).toBeInTheDocument()
    expect(screen.getByText('De nouvelles adresses arrivent bientôt.')).toBeInTheDocument()
    expect(screen.getByTestId('marketing-stage')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-city-slug]')).toHaveLength(0)
    expect(container.querySelectorAll('article')).toHaveLength(0)
  })

  it('exports the exact static metadata contract for the index', async () => {
    const { metadata } = await import('@/app/(public)/decouvrir/page')

    expect(metadata.title).toBe('Découvrir les bonnes adresses locales — MyStay')
    expect(metadata.description).toBe(
      'Découvrez les adresses locales sélectionnées par MyStay, dans les villes où elles sont actuellement publiées.',
    )
    expect(metadata.alternates?.canonical).toBe('/decouvrir')
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      url: '/decouvrir',
      title: metadata.title,
      description: metadata.description,
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
    })
  })
})
