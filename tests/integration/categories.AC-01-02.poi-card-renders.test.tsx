/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

// react-markdown est ESM (casse le transform jest) ; on substitue MarkdownText par un
// rendu identifiable pour vérifier que la description passe bien par lui.
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div data-testid="poi-markdown">{source}</div>,
}))

const poi: PoiCardType = {
  id: '1',
  name: 'Le Bistrot du Mont-Blanc',
  slug: 'restaurants-gastro-demo',
  address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  subcategory_name: 'Gastronomique',
  rating: 4.5,
  rating_count: 120,
  is_open_now: true,
  distance_km: 1.234,
  photo_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'],
  phone: '+33450000000',
  website: null,
  description: 'Une table gastronomique au pied du Mont-Blanc.',
  closes_at_label: '20h',
  latitude: 45.89,
  longitude: 6.71,
}

describe('PoiCard — AC-01-02 (SpaCard redesign)', () => {
  beforeEach(() => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
  })

  it('renders the POI name', () => {
    expect(screen.getByText('Le Bistrot du Mont-Blanc')).toBeInTheDocument()
  })

  it('renders the subcategory name', () => {
    expect(screen.getByText('Gastronomique')).toBeInTheDocument()
  })

  it('renders the address', () => {
    expect(screen.getByText('Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
  })

  it('renders the distance in km', () => {
    expect(screen.getByTestId('poi-distance')).toHaveTextContent('1.2 km')
  })

  it('renders the photo as an img', () => {
    const img = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400')
    expect(img).toHaveClass('object-cover')
    expect(img).toHaveClass('object-center')
    expect(img).not.toHaveClass('object-contain')
  })

  it('switches the header photo to object-contain when the loaded image is landscape', async () => {
    const img = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })

    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 1600 })
    Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 900 })
    fireEvent.load(img)

    await waitFor(() => {
      expect(img).toHaveClass('object-contain')
    })
    expect(img).not.toHaveClass('object-cover')
  })

  it('renders the APPELER button as a tel: link at the bottom of the expanded section', () => {
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))
    const panel = screen.getByTestId('poi-more-info')
    expect(within(panel).getByText('APPELER').closest('a')).toHaveAttribute('href', 'tel:+33450000000')
  })

  it('shows the closing time when available', () => {
    expect(screen.getByText('20h')).toBeInTheDocument()
  })
})

describe('PoiCard — accordion behaviour', () => {
  it('reveals the description only after expanding', () => {
    render(
      <PoiCard
        poi={{ ...poi, description: 'Une table recommandée après une randonnée.' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    expect(screen.queryByText('Une table recommandée après une randonnée.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))
    expect(screen.getByText('Une table recommandée après une randonnée.')).toBeInTheDocument()
  })

  it('renders the description through MarkdownText (markdown-aware)', () => {
    render(
      <PoiCard
        poi={{ ...poi, description: '## Traversée\nDepuis la gare.' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))
    const markdown = screen.getByTestId('poi-markdown')
    expect(within(markdown).getByText(/Traversée/)).toBeInTheDocument()
  })

  it('renders distance in metres when < 1 km', () => {
    render(<PoiCard poi={{ ...poi, distance_km: 0.35 }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const distanceEls = screen.getAllByTestId('poi-distance')
    expect(distanceEls[distanceEls.length - 1]).toHaveTextContent('350 m')
  })

  it('hides the APPELER button when no phone is set', () => {
    render(<PoiCard poi={{ ...poi, phone: null }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByText('APPELER')).not.toBeInTheDocument()
  })
})

describe('PoiCard — infos POI (non-rando)', () => {
  it('shows a share button next to the favourite and shares the POI detail URL', () => {
    const share = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    fireEvent.click(screen.getByRole('button', { name: /partager/i }))
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/guide/saint-gervais-les-bains/restaurants/restaurants-gastro-demo'),
      }),
    )
  })

  it('renders the rating as stars above the distance', () => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.getByTestId('poi-rating')).toBeInTheDocument()
  })

  it('hides the stars when no rating is available', () => {
    render(
      <PoiCard
        poi={{ ...poi, rating: null }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    expect(screen.queryByTestId('poi-rating')).not.toBeInTheDocument()
  })

  it('shows an Itinéraire (directions) button at the bottom of the expanded section', () => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))

    const panel = screen.getByTestId('poi-more-info')
    expect(within(panel).getByRole('link', { name: /itinéraire/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=45.89,6.71',
    )
  })

  it('shows the website as a "Site" button but not the rating/status (already in the header)', () => {
    render(
      <PoiCard
        poi={{ ...poi, website: 'https://resto.example.com' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))

    const panel = screen.getByTestId('poi-more-info')
    expect(within(panel).getByRole('link', { name: /^site$/i })).toHaveAttribute(
      'href',
      'https://resto.example.com',
    )
    // Note + avis et statut Ouvert/Fermé sont déjà dans l'en-tête → pas de doublon ici
    expect(within(panel).queryByText(/avis/i)).not.toBeInTheDocument()
    expect(within(panel).queryByText(/ouvert|fermé/i)).not.toBeInTheDocument()
  })

  it('shows itinéraire, site and appeler as three buttons on the same row', () => {
    render(
      <PoiCard
        poi={{ ...poi, website: 'https://resto.example.com', phone: '+33450000000' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))

    const panel = screen.getByTestId('poi-more-info')
    const itineraire = within(panel).getByRole('link', { name: /itinéraire/i })
    const site = within(panel).getByRole('link', { name: /^site$/i })
    const appeler = within(panel).getByRole('link', { name: /appeler/i })

    expect(site).toHaveAttribute('href', 'https://resto.example.com')
    expect(appeler).toHaveAttribute('href', 'tel:+33450000000')
    // Les trois partagent la même ligne (même conteneur flex direct)
    expect(itineraire.parentElement).toBe(site.parentElement)
    expect(site.parentElement).toBe(appeler.parentElement)
    expect(itineraire.parentElement).toHaveClass('flex')
  })
})

describe('PoiCard — horaires (ouvre / ferme)', () => {
  it('shows the closing time when open', () => {
    render(<PoiCard poi={{ ...poi, is_open_now: true }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const line = screen.getByTestId('poi-hours-line')
    expect(line).toHaveTextContent(/Ferme à/i)
    expect(line).toHaveTextContent('20h')
  })

  it('shows the next opening (day + hour) when closed', () => {
    render(
      <PoiCard
        poi={{ ...poi, is_open_now: false, next_open_label: 'demain à 9h' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    const line = screen.getByTestId('poi-hours-line')
    expect(line).toHaveTextContent(/Ouvre/i)
    expect(line).toHaveTextContent('demain à 9h')
    expect(line).not.toHaveTextContent(/Ferme à/i)
  })

  it('always keeps a bottom padding (pb-2) under the hours line', () => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.getByTestId('poi-hours-line')).toHaveClass('pb-2')
  })
})

describe('PoiCard — pastille ouvert/fermé', () => {
  it('renders the open pill with a filled green background and white text', () => {
    render(<PoiCard poi={{ ...poi, is_open_now: true }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const pill = screen.getByTestId('badge-open')
    expect(pill).toHaveClass('bg-green-500/90')
    expect(pill).toHaveClass('text-white')
  })

  it('renders the closed pill with a filled red background and white text', () => {
    render(<PoiCard poi={{ ...poi, is_open_now: false }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const pill = screen.getByTestId('badge-closed')
    expect(pill).toHaveClass('bg-red-500/90')
    expect(pill).toHaveClass('text-white')
  })
})

describe('PoiCard — galerie photos (carrousel d’en-tête)', () => {
  const multi: PoiCardType = {
    ...poi,
    photo_url: 'https://x/a.jpg',
    photos: ['https://x/a.jpg', 'https://x/b.jpg', 'https://x/c.jpg'],
  }

  it('shows nav arrows when more than one photo and advances to the next photo', () => {
    render(<PoiCard poi={multi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.getByRole('img', { name: multi.name })).toHaveAttribute('src', 'https://x/a.jpg')

    fireEvent.click(screen.getByRole('button', { name: /photo suivante/i }))
    expect(screen.getByRole('img', { name: multi.name })).toHaveAttribute('src', 'https://x/b.jpg')
  })

  it('wraps from the first photo to the last when going previous', () => {
    render(<PoiCard poi={multi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    fireEvent.click(screen.getByRole('button', { name: /photo précédente/i }))
    expect(screen.getByRole('img', { name: multi.name })).toHaveAttribute('src', 'https://x/c.jpg')
  })

  it('shows no arrows when there is a single photo', () => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByRole('button', { name: /photo suivante/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /photo précédente/i })).not.toBeInTheDocument()
  })

  it('no longer renders the duplicated auto-scroll gallery after expanding', () => {
    render(<PoiCard poi={multi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    fireEvent.click(screen.getByText(multi.name))
    // En-tête en carrousel = 1 seule image visible (plus de bande dupliquée qui boucle).
    expect(screen.getAllByRole('img', { name: multi.name })).toHaveLength(1)
  })
})

describe('PoiCard — randonnée variant', () => {
  const trailPoi: PoiCardType = {
    ...poi,
    name: 'Lac de Pormenaz',
    slug: 'lac-de-pormenaz',
    phone: null,
    is_open_now: null,
    closes_at_label: null,
    trail_detail: {
      difficulty: 'medium',
      estimated_duration_min: 210,
      distance_km: 8.4,
      elevation_gain_m: 950,
    },
  }

  it('shows trail stats (duration, distance, elevation) instead of opening hours', () => {
    render(<PoiCard poi={trailPoi} citySlug="les-contamines-montjoie" categorySlug="rando" />)
    const stats = screen.getByTestId('trail-stats')
    expect(stats).toHaveTextContent('3h30')
    expect(stats).toHaveTextContent('8.4 km')
    expect(stats).toHaveTextContent('950 m')
  })

  it('shows the difficulty badge and no open/closed badge', () => {
    render(<PoiCard poi={trailPoi} citySlug="les-contamines-montjoie" categorySlug="rando" />)
    expect(screen.getByTestId('badge-difficulty')).toHaveTextContent('Modéré')
    expect(screen.queryByTestId('badge-closed')).not.toBeInTheDocument()
  })

  it('never shows the APPELER button for a trail', () => {
    render(
      <PoiCard
        poi={{ ...trailPoi, phone: '+33450000000' }}
        citySlug="les-contamines-montjoie"
        categorySlug="rando"
      />,
    )
    expect(screen.queryByText('APPELER')).not.toBeInTheDocument()
  })
})
