/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import { OwnerRecommendationsBlock } from '@/features/lodging-showcase/components/OwnerRecommendationsBlock'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

const items = [
  {
    id: 'local-1',
    name: 'Le Port',
    slug: 'le-port',
    category_slug: 'restaurants',
    city_slug: 'annecy',
    city_name: 'Annecy',
    owner_note: 'Ideal pour diner au bord de l eau.',
    photo_url: null,
  },
  {
    id: 'other-1',
    name: 'Aiguille du Midi',
    slug: 'aiguille-du-midi',
    category_slug: 'explorer',
    city_slug: 'chamonix',
    city_name: 'Chamonix',
    owner_note: 'A reserver par temps clair.',
    photo_url: null,
  },
  {
    id: 'other-2',
    name: 'Mer de Glace',
    slug: 'mer-de-glace',
    category_slug: 'explorer',
    city_slug: 'chamonix',
    city_name: 'Chamonix',
    owner_note: null,
    photo_url: null,
  },
]

describe('AC-02-05/06: recommandations de la fiche logement', () => {
  it('separates local and cross-city recommendations', () => {
    render(<OwnerRecommendationsBlock citySlug="annecy" items={items} />)

    const localSection = screen.getByRole('region', {
      name: 'Les recommandations de votre hôte',
    })
    const otherSection = screen.getByRole('region', {
      name: 'À découvrir ailleurs',
    })

    expect(within(localSection).getByText('Le Port')).toBeInTheDocument()
    expect(within(localSection).queryByText('Aiguille du Midi')).not.toBeInTheDocument()
    expect(within(otherSection).getByText('Chamonix')).toBeInTheDocument()
    expect(within(otherSection).getByText('Aiguille du Midi')).toBeInTheDocument()
    expect(within(otherSection).getByText('Mer de Glace')).toBeInTheDocument()
  })

  it('shows comments and uses the POI city in links', () => {
    render(<OwnerRecommendationsBlock citySlug="annecy" items={items} />)

    expect(screen.getByText('Ideal pour diner au bord de l eau.')).toBeInTheDocument()
    expect(screen.getByText('A reserver par temps clair.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Le Port/ })).toHaveAttribute(
      'href',
      '/guide/annecy/restaurants/le-port',
    )
    expect(screen.getByRole('link', { name: /Aiguille du Midi/ })).toHaveAttribute(
      'href',
      '/guide/chamonix/explorer/aiguille-du-midi',
    )
  })
})
