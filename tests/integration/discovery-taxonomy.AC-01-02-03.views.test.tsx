/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import { DiscoveryCategoryView } from '@/features/public-discovery/components/DiscoveryCategoryView'
import { DiscoveryCityView } from '@/features/public-discovery/components/DiscoveryCityView'
import { DiscoveryPoiCard } from '@/features/public-discovery/components/DiscoveryPoiCard'
import { RemotePoiImage } from '@/features/public-discovery/components/RemotePoiImage'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryPoiCard as DiscoveryPoiCardDto,
} from '@/features/public-discovery/types'

jest.mock('next/navigation', () => ({ usePathname: () => '/decouvrir' }))

// Spec 065 — /decouvrir organisé par la taxonomie admin.
const citySummary = {
  name: 'Saint-Gervais-les-Bains',
  slug: 'saint-gervais-les-bains',
  postal_code: '74170',
  department: null,
  region: null,
}

function card(slug: string, overrides: Partial<DiscoveryPoiCardDto> = {}): DiscoveryPoiCardDto {
  return {
    name: slug,
    slug,
    address: 'Adresse',
    latitude: 45.89,
    longitude: 6.71,
    rating: null,
    rating_count: null,
    is_open_now: null,
    photo_url: `https://images.example.com/${slug}.jpg`,
    photo_is_fallback: false,
    category: { name: 'Shopping', slug: 'shopping' },
    subcategory: null,
    distance_km: 0.5,
    zone: 'primary',
    ...overrides,
  }
}

const ski = { name: 'Location de ski', slug: 'location-de-ski' }
const boutiques = { name: 'Boutiques locales', slug: 'boutiques-locales' }

function category(overrides: Partial<DiscoveryCategory> = {}): DiscoveryCategory {
  const groups = overrides.groups ?? [
    { subcategory: boutiques, pois: [card('boutique-a', { subcategory: boutiques }), card('boutique-b', { subcategory: boutiques })] },
    { subcategory: ski, pois: [card('blanc-sport', { subcategory: ski })] },
    { subcategory: null, pois: [card('sans-sous')] },
  ]
  return {
    name: 'Shopping',
    slug: 'shopping',
    icon: 'shopping-bag',
    sort_order: 4,
    city: citySummary,
    subcategories: [boutiques, ski],
    pois: groups.flatMap(group => group.pois),
    groups,
    nearby_pois: [],
    ...overrides,
  }
}

describe('065 US-02 — page catégorie découpée par sous-catégorie', () => {
  it('AC-02-01 : une section titrée et ancrée par sous-catégorie, dans l’ordre reçu', () => {
    render(<DiscoveryCategoryView category={category()} />)

    const main = screen.getByRole('main')
    const headings = within(main).getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)
    expect(headings).toEqual(['Boutiques locales', 'Location de ski', 'Autres adresses'])

    const skiSection = document.getElementById('location-de-ski')
    expect(skiSection).not.toBeNull()
    expect(within(skiSection!).getByRole('link', { name: /blanc-sport/ })).toBeInTheDocument()
  })

  it('AC-02-02 : un menu de pastilles mène à chaque section avec son nombre d’adresses', () => {
    render(<DiscoveryCategoryView category={category()} />)

    const menu = screen.getByRole('navigation', { name: 'Sous-catégories' })
    const links = within(menu).getAllByRole('link')
    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Boutiques locales2', '#boutiques-locales'],
      ['Location de ski1', '#location-de-ski'],
      ['Autres adresses1', '#autres-adresses'],
    ])
    expect(menu.className).toContain('sticky')
    expect(menu.className).toContain('overflow-x-auto')
  })

  it('AC-02-03 : les POI sans sous-catégorie forment « Autres adresses »', () => {
    render(<DiscoveryCategoryView category={category()} />)

    const others = document.getElementById('autres-adresses')
    expect(within(others!).getByRole('link', { name: /sans-sous/ })).toBeInTheDocument()
  })

  it('AC-02-04 : un seul groupe → liste simple, sans pastilles ni titres de section', () => {
    render(<DiscoveryCategoryView category={category({
      groups: [{ subcategory: ski, pois: [card('blanc-sport', { subcategory: ski })] }],
    })} />)

    expect(screen.queryByRole('navigation', { name: 'Sous-catégories' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Location de ski' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /blanc-sport/ })).toBeInTheDocument()
  })

  it('AC-02-05 : « Aux alentours » reste une section séparée, non regroupée', () => {
    render(<DiscoveryCategoryView category={category({
      nearby_pois: [card('loin', { subcategory: ski, zone: 'nearby', distance_km: 20 })],
    })} />)

    const nearby = screen.getByRole('heading', { name: 'Aux alentours' }).closest('section')!
    expect(within(nearby).getByRole('link', { name: /loin/ })).toBeInTheDocument()
    expect(within(nearby).queryByRole('heading', { name: 'Location de ski' })).not.toBeInTheDocument()
  })
})

describe('065 US-01 — page ville organisée par la taxonomie', () => {
  const city: DiscoveryCity = {
    ...citySummary,
    categories: [
      {
        name: 'Dîner', slug: 'diner', icon: 'utensils', sort_order: 0, poi_count: 1,
        subcategories: [{ name: 'Restaurants', slug: 'restaurants', poi_count: 1 }],
        pois: [card('le-terrier', { category: { name: 'Dîner', slug: 'diner' } })],
      },
      {
        name: 'Shopping', slug: 'shopping', icon: 'icone-inconnue', sort_order: 4, poi_count: 5,
        subcategories: [
          { name: 'Boutiques locales', slug: 'boutiques-locales', poi_count: 2 },
          { name: 'Produits régionaux', slug: 'produits-regionaux', poi_count: 1 },
          { name: 'Location de ski', slug: 'location-de-ski', poi_count: 1 },
          { name: 'Souvenirs', slug: 'souvenirs', poi_count: 1 },
        ],
        pois: ['a', 'b', 'c', 'd', 'e'].map(slug => card(`shop-${slug}`)),
      },
    ],
  }

  it('AC-01-01 : icône de la taxonomie, ou icône par défaut si inconnue', () => {
    render(<DiscoveryCityView city={city} />)

    const diner = screen.getByRole('link', { name: /Dîner/ })
    expect(diner.querySelector('svg.lucide-utensils')).not.toBeNull()
    const shopping = screen.getByRole('link', { name: /^Shopping/ })
    expect(shopping.querySelector('svg.lucide-map-pinned')).not.toBeNull()
  })

  it('AC-01-02 : trois sous-catégories au plus sur la carte, puis « … »', () => {
    render(<DiscoveryCityView city={city} />)

    const shopping = screen.getByRole('link', { name: /^Shopping/ })
    expect(shopping).toHaveTextContent('Boutiques locales · Produits régionaux · Location de ski…')
    expect(shopping).not.toHaveTextContent('Souvenirs')
  })

  it('AC-01-03 : adresses regroupées par catégorie, 3 cartes et un lien vers la suite', () => {
    render(<DiscoveryCityView city={city} />)

    const shoppingSection = screen.getByRole('heading', { level: 3, name: 'Shopping' }).closest('section')!
    expect(within(shoppingSection).getAllByRole('article')).toHaveLength(3)
    expect(within(shoppingSection).getByRole('link', { name: 'Voir les 5 adresses' })).toHaveAttribute(
      'href',
      '/decouvrir/saint-gervais-les-bains/shopping',
    )

    const dinerSection = screen.getByRole('heading', { level: 3, name: 'Dîner' }).closest('section')!
    expect(within(dinerSection).queryByRole('link', { name: /Voir les/ })).not.toBeInTheDocument()
  })
})

describe('065 AC-03-03 — carte d’un POI sans photo', () => {
  it('affiche l’image de remplacement avec un texte alternatif neutre', () => {
    render(<DiscoveryPoiCard citySlug="saint-gervais-les-bains" poi={card('blanc-sport', {
      subcategory: ski,
      photo_url: '/fallback/fallback-location-de-ski.png',
      photo_is_fallback: true,
    })} />)

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Illustration : Location de ski')
  })

  it('sert l’image locale de remplacement par l’optimiseur next/image', () => {
    render(<RemotePoiImage src="/fallback/fallback-location-de-ski.png" alt="Illustration" width={800} height={600} loading="lazy" />)

    expect(screen.getByRole('img').getAttribute('src')).toContain('/_next/image?url=%2Ffallback%2Ffallback-location-de-ski.png')
  })
})
