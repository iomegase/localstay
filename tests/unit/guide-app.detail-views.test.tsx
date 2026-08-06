/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideLodgingsView } from '@/features/guide-app/components/GuideLodgingsView'
import { GuideBlogView } from '@/features/guide-app/components/GuideBlogView'
import { GuideBlogDetailView } from '@/features/guide-app/components/GuideBlogDetailView'
import { GuideLodgingDetailView } from '@/features/guide-app/components/GuideLodgingDetailView'
import type {
  GuideBlogPost,
  GuideLodgingCard,
} from '@/features/guide-app/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const lodging: GuideLodgingCard = {
  id: 'l1',
  slug: 'chalet-remy',
  citySlug: 'saint-gervais',
  title: 'Chalet Rémy',
  cityName: 'Saint-Gervais',
  propertyType: 'Chalet',
  coverPhotoUrl: null,
  shortDescription: 'Cosy',
  maxGuests: 6,
  bedroomCount: 3,
  publicAreaLabel: null,
  amenities: ['Wifi'],
}

const post: GuideBlogPost = {
  id: 'a1',
  slug: 'un-article',
  title: 'Un article',
  excerpt: 'Extrait',
  categoryLabel: 'Inspirations',
  coverUrl: null,
  cityName: 'Saint-Gervais',
}

describe('Guide internal list → detail wiring', () => {
  it('opens a lodging via onOpen without any outgoing link', () => {
    const onOpen = jest.fn()
    render(<GuideLodgingsView lodgings={[lodging]} onOpen={onOpen} />)
    // Aucun lien sortant : la carte est un bouton, pas un <a>.
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /voir chalet rémy/i }))
    expect(onOpen).toHaveBeenCalledWith(lodging)
  })

  it('opens a blog post via onOpen without any outgoing link', () => {
    const onOpen = jest.fn()
    render(<GuideBlogView posts={[post]} onOpen={onOpen} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /lire un article/i }))
    expect(onOpen).toHaveBeenCalledWith(post)
  })
})

describe('Guide detail views', () => {
  it('shows a loading state then the article content', () => {
    const { rerender } = render(
      <GuideBlogDetailView detail={null} onBack={() => {}} />,
    )
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()

    rerender(
      <GuideBlogDetailView
        detail={{
          title: 'Un article',
          categoryLabel: 'Inspirations',
          cityName: 'Saint-Gervais',
          coverUrl: null,
          contentMarkdown: '# Bonjour le monde',
        }}
        onBack={() => {}}
      />,
    )
    expect(screen.getByText('Un article')).toBeInTheDocument()
    expect(screen.getByText(/bonjour le monde/i)).toBeInTheDocument()
  })

  it('renders lodging facts and calls back', () => {
    const onBack = jest.fn()
    render(
      <GuideLodgingDetailView
        detail={{
          title: 'Chalet Rémy',
          cityName: 'Saint-Gervais',
          propertyType: 'Chalet',
          description: 'Beau chalet',
          maxGuests: 6,
          bedroomCount: 3,
          bathroomCount: 2,
          surfaceM2: 120,
          photos: [],
          amenitiesIncluded: ['Wifi'],
          amenitiesOnRequest: [],
        }}
        onBack={onBack}
      />,
    )
    expect(screen.getByText('Chalet Rémy')).toBeInTheDocument()
    expect(screen.getByText('Beau chalet')).toBeInTheDocument()
    expect(screen.getByText('Wifi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /nos logements/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('opens the photo gallery in a lightbox instead of stacking', () => {
    render(
      <GuideLodgingDetailView
        detail={{
          title: 'Chalet Rémy',
          cityName: 'Saint-Gervais',
          propertyType: 'Chalet',
          description: '',
          maxGuests: 6,
          bedroomCount: 3,
          bathroomCount: 2,
          surfaceM2: 120,
          photos: [
            { url: 'https://cdn/a.jpg', alt: 'a' },
            { url: 'https://cdn/b.jpg', alt: 'b' },
            { url: 'https://cdn/c.jpg', alt: 'c' },
          ],
          amenitiesIncluded: [],
          amenitiesOnRequest: [],
        }}
        onBack={() => {}}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ouvrir la galerie photos/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
