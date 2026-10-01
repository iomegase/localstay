/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'

const photo = (id: string, room_type: string, room_label: string | null, sort_order: number) => ({
  id,
  url: `${id}.jpg`,
  alt: `${room_label ?? room_type} ${id}`,
  room_type,
  room_label,
  sort_order,
  is_cover: false,
})

// Ordre de saisie volontairement mélangé : la grille doit regrouper par catégorie.
const photos = [
  photo('p1', 'common_area', 'Salon', 0),
  photo('p2', 'bedroom', 'Chambre 1', 1),
  photo('p3', 'bathroom', 'Salle de bain 1', 2),
  photo('p4', 'exterior', 'Terrasse', 3),
  photo('p5', 'common_area', 'Cinéma', 4),
  photo('p6', 'kitchen', null, 5),
  photo('p7', 'bedroom', 'Chambre 2', 6),
  photo('p8', 'exterior', null, 7),
  photo('p9', 'common_area', 'Jacuzzi', 8),
  photo('p10', 'common_area', 'Entrée', 9),
  photo('p11', 'common_area', 'Salle à manger', 10),
  photo('p12', 'common_area', 'Sauna', 11),
  photo('p13', 'common_area', 'Skiroom', 12),
  photo('p14', 'common_area', 'Salon', 13),
]

const cardLabels = () =>
  screen.getAllByTestId('lodging-room-card').map(card => within(card).getByTestId('lodging-room-label').textContent)

describe('028 AC-02-11 — rooms grid category pills', () => {
  it('shows discreet pills Tout · Salon · Cuisine · Chambres · SdBs · Bien-être · Loisirs · Entrée · Extérieur, Tout active by default', () => {
    render(<LodgingRoomsGrid photos={photos} />)

    const menu = screen.getByRole('group', { name: 'Filtrer les photos par pièce' })
    const pills = within(menu).getAllByRole('button')
    expect(pills.map(pill => pill.textContent)).toEqual([
      'Tout', 'Salon', 'Cuisine', 'Chambres', 'SdBs', 'Bien-être', 'Loisirs', 'Entrée', 'Extérieur',
    ])
    expect(within(menu).getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
    pills.forEach(pill => expect(pill).toHaveClass('rounded-full'))
  })

  it('orders every card by category under Tout, keeping photo order inside a category', () => {
    render(<LodgingRoomsGrid photos={photos} />)

    expect(cardLabels()).toEqual([
      'Salon', 'Salle à manger',
      'Cuisine',
      'Chambre 1', 'Chambre 2',
      'Salle de bain 1',
      'Jacuzzi', 'Sauna',
      'Cinéma',
      'Entrée', 'Skiroom',
      'Terrasse', 'Extérieur',
    ])
  })

  it('filters the cards when a pill is selected', () => {
    render(<LodgingRoomsGrid photos={photos} />)

    fireEvent.click(screen.getByRole('button', { name: 'Chambres' }))
    expect(screen.getByRole('button', { name: 'Chambres' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'false')
    expect(cardLabels()).toEqual(['Chambre 1', 'Chambre 2'])

    fireEvent.click(screen.getByRole('button', { name: 'Salon' }))
    expect(cardLabels()).toEqual(['Salon', 'Salle à manger'])

    fireEvent.click(screen.getByRole('button', { name: 'Bien-être' }))
    expect(cardLabels()).toEqual(['Jacuzzi', 'Sauna'])

    fireEvent.click(screen.getByRole('button', { name: 'Entrée' }))
    expect(cardLabels()).toEqual(['Entrée', 'Skiroom'])

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }))
    expect(cardLabels()).toHaveLength(13)
  })

  it('only offers pills for categories that have photos, and none with a single category', () => {
    const { unmount } = render(<LodgingRoomsGrid photos={photos.filter(p => p.room_type !== 'kitchen')} />)
    expect(screen.queryByRole('button', { name: 'Cuisine' })).not.toBeInTheDocument()
    unmount()

    render(<LodgingRoomsGrid photos={photos.filter(p => p.room_type === 'bedroom')} />)
    expect(screen.queryByRole('group', { name: 'Filtrer les photos par pièce' })).not.toBeInTheDocument()
  })

  it('puts the room name top-right and the dots with the photo count bottom-right, in a dark pill', () => {
    render(<LodgingRoomsGrid photos={photos} />)

    const salon = screen.getAllByTestId('lodging-room-card')[0]
    expect(within(salon).getByTestId('lodging-room-label')).toHaveClass('top-2', 'right-2')
    const dots = within(salon).getByTestId('lodging-room-dots')
    expect(dots).toHaveClass('bottom-2', 'right-2', 'rounded-full', 'bg-black/45')
    expect(within(dots).getAllByRole('button')).toHaveLength(2)
    expect(within(dots).getByTestId('lodging-room-count')).toHaveTextContent('2')
  })

  it('shows at most 5 dots, sliding with the active photo', () => {
    const many = Array.from({ length: 10 }, (_, i) => photo(`s${i}`, 'common_area', 'Salon', i))
    render(<LodgingRoomsGrid photos={many} />)

    const dots = screen.getByTestId('lodging-room-dots')
    expect(within(dots).getAllByRole('button')).toHaveLength(5)
    expect(within(dots).getByRole('button', { name: 'Voir la photo 1 de Salon' })).toBeInTheDocument()
    expect(within(dots).getByTestId('lodging-room-count')).toHaveTextContent('10')
  })

  it('removes the dark overlay and shows the room name in a small white pill', () => {
    render(<LodgingRoomsGrid photos={photos} />)

    const card = screen.getAllByTestId('lodging-room-card')[0]
    expect(card.querySelector('[class*="bg-gradient-to-t"]')).toBeNull()
    expect(card.querySelector('[class*="from-black"]')).toBeNull()
    expect(within(card).getByTestId('lodging-room-label')).toHaveClass('rounded-full', 'bg-white/90', 'text-slate-900')
  })
})
