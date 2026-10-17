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
  it('shows discreet pills Tout · Chambres · SdBs · Salon · Cuisine · Bien-être · Loisirs · Entrée · Extérieur, Tout active by default (AC-02-28)', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos} />)

    const menu = screen.getByRole('group', { name: 'Filtrer les photos par pièce' })
    const pills = within(menu).getAllByRole('button')
    expect(pills.map(pill => pill.textContent)).toEqual([
      'Tout', 'Chambres', 'SdBs', 'Salon', 'Cuisine', 'Bien-être', 'Loisirs', 'Entrée', 'Extérieur',
    ])
    expect(within(menu).getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
    pills.forEach(pill => expect(pill).toHaveClass('rounded-full'))
  })

  it('orders cards under Tout: bedrooms, bathrooms, then the rest alphabetically (AC-02-28)', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos} />)

    expect(cardLabels()).toEqual([
      'Chambre 1', 'Chambre 2',
      'Salle de bain 1',
      'Cinéma', 'Cuisine', 'Entrée', 'Extérieur', 'Jacuzzi', 'Salle à manger', 'Salon', 'Sauna', 'Skiroom', 'Terrasse',
    ])
  })

  it('filters the cards when a pill is selected', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos} />)

    fireEvent.click(screen.getByRole('button', { name: 'Chambres' }))
    expect(screen.getByRole('button', { name: 'Chambres' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'false')
    expect(cardLabels()).toEqual(['Chambre 1', 'Chambre 2'])

    fireEvent.click(screen.getByRole('button', { name: 'Salon' }))
    expect(cardLabels()).toEqual(['Salle à manger', 'Salon'])

    fireEvent.click(screen.getByRole('button', { name: 'Bien-être' }))
    expect(cardLabels()).toEqual(['Jacuzzi', 'Sauna'])

    fireEvent.click(screen.getByRole('button', { name: 'Entrée' }))
    expect(cardLabels()).toEqual(['Entrée', 'Skiroom'])

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }))
    expect(cardLabels()).toHaveLength(13)
  })

  it('only offers pills for categories that have photos, and none with a single category', () => {
    const { unmount } = render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos.filter(p => p.room_type !== 'kitchen')} />)
    expect(screen.queryByRole('button', { name: 'Cuisine' })).not.toBeInTheDocument()
    unmount()

    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos.filter(p => p.room_type === 'bedroom')} />)
    expect(screen.queryByRole('group', { name: 'Filtrer les photos par pièce' })).not.toBeInTheDocument()
  })

  it('puts the room name top-right and the dots with the photo count bottom-right, in a dark pill', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos} />)

    const salon = screen.getAllByTestId('lodging-room-card').find(card => within(card).getByTestId('lodging-room-label').textContent === 'Salon')!
    expect(within(salon).getByTestId('lodging-room-label')).toHaveClass('top-2', 'right-2')
    const dots = within(salon).getByTestId('lodging-room-dots')
    // AC-02-20 : pastille claire, plus d'overlay sombre.
    expect(dots).toHaveClass('bottom-2', 'right-2', 'rounded-full', 'bg-white/60')
    expect(dots).not.toHaveClass('bg-black/30')
    expect(within(dots).getByTestId('lodging-room-count')).toHaveClass('text-slate-900')
    expect(within(dots).getAllByRole('button')).toHaveLength(2)
    expect(within(dots).getByTestId('lodging-room-count')).toHaveTextContent('2')
  })

  it('shows at most 5 dots, sliding with the active photo', () => {
    const many = Array.from({ length: 10 }, (_, i) => photo(`s${i}`, 'common_area', 'Salon', i))
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={many} />)

    const dots = screen.getByTestId('lodging-room-dots')
    expect(within(dots).getAllByRole('button')).toHaveLength(5)
    expect(within(dots).getByRole('button', { name: 'Voir la photo 1 de Salon' })).toBeInTheDocument()
    expect(within(dots).getByTestId('lodging-room-count')).toHaveTextContent('10')
  })

  it('removes the dark overlay and shows the room name in a small white pill', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet Hygge" photos={photos} />)

    const card = screen.getAllByTestId('lodging-room-card')[0]
    expect(card.querySelector('[class*="bg-gradient-to-t"]')).toBeNull()
    expect(card.querySelector('[class*="from-black"]')).toBeNull()
    expect(within(card).getByTestId('lodging-room-label')).toHaveClass('rounded-full', 'bg-white/60', 'font-medium', 'text-slate-900')
  })
})

describe('028 AC-02-22 — photos « Vue » rangées dans Extérieur', () => {
  it('shows a « Vue » card under the « Extérieur » filter', async () => {
    const { categorizeRoomGroups } = await import('@/features/lodging-showcase/lib/room-categories')
    const groups = categorizeRoomGroups([
      { id: 'v1', url: 'https://cdn.test/v1.jpg', alt: 'Vue', room_type: 'exterior', room_label: 'Vue', sort_order: 0, is_cover: false },
    ])
    expect(groups).toEqual([expect.objectContaining({ label: 'Vue', category: 'exterior' })])
  })
})

describe('028 AC-02-25 — Balcon dans Extérieur, Salle de réunion dans « Réunion »', () => {
  it('files the new categories under the right pills', async () => {
    const { categorizeRoomGroups } = await import('@/features/lodging-showcase/lib/room-categories')
    const groups = categorizeRoomGroups([
      { id: 'b1', url: 'https://cdn.test/b1.jpg', alt: 'Balcon', room_type: 'exterior', room_label: 'Balcon', sort_order: 0, is_cover: false },
      { id: 'm1', url: 'https://cdn.test/m1.jpg', alt: 'Réunion', room_type: 'common_area', room_label: 'Salle de réunion', sort_order: 1, is_cover: false },
      { id: 'r1', url: 'https://cdn.test/r1.jpg', alt: 'Bar', room_type: 'common_area', room_label: 'Bar', sort_order: 2, is_cover: false },
    ])
    expect(groups.map(group => [group.label, group.category])).toEqual([['Balcon', 'exterior'], ['Bar', 'leisure'], ['Salle de réunion', 'meeting']])
  })
})

describe('028 AC-02-27 — tri numérique des cartes dans une catégorie', () => {
  it('orders numbered rooms 1, 2… 10 regardless of photo order', () => {
    const rooms = [9, 2, 10, 1, 3].map((number, index) => photo(`c${number}`, 'bedroom', `Chambre ${number}`, index))
    render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={[photo('k', 'kitchen', null, 99), ...rooms]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chambres' }))
    expect(cardLabels()).toEqual(['Chambre 1', 'Chambre 2', 'Chambre 3', 'Chambre 9', 'Chambre 10'])
  })
})

describe('028 AC-02-30 — 2 rangées puis « Voir toutes les pièces »', () => {
  const many = Array.from({ length: 12 }, (_, index) => photo(`r${index}`, 'bedroom', `Chambre ${index + 1}`, index))
  const wrappers = () => Array.from(screen.getByTestId('lodging-rooms-cards').children) as HTMLElement[]

  it('hides cards beyond two rows per breakpoint and expands on click', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={many} />)
    const items = wrappers()
    expect(items[3].className).toBe('')
    expect(items[4]).toHaveClass('hidden', 'sm:block')
    expect(items[6]).toHaveClass('hidden', 'lg:block')
    expect(items[10]).toHaveClass('hidden')
    const toggle = screen.getByRole('button', { name: 'Voir toutes les pièces (12)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(wrappers().every(item => !item.className.includes('hidden'))).toBe(true)
    expect(screen.getByRole('button', { name: 'Réduire' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows no button when everything fits in two rows', () => {
    render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={many.slice(0, 4)} />)
    expect(screen.queryByRole('button', { name: /Voir toutes les pièces/ })).not.toBeInTheDocument()
  })
})

describe('028 AC-02-31 — boutons en pill, alignés à droite', () => {
  it('styles « Voir toutes les pièces » like the filter pills, right-aligned', () => {
    const many = Array.from({ length: 12 }, (_, index) => photo(`q${index}`, 'bedroom', `Chambre ${index + 1}`, index))
    render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={many} />)
    const button = screen.getByRole('button', { name: /Voir toutes les pièces/ })
    expect(button).toHaveClass('rounded-full', 'px-3', 'py-1', 'text-[11px]')
    expect(button.parentElement).toHaveClass('justify-end', 'pr-4')
  })
})

describe('028 AC-02-32 — « Autre » est une catégorie à part entière', () => {
  it('forme une carte « Autre », toujours en dernier sous « Tout »', async () => {
    const { categorizeRoomGroups } = await import('@/features/lodging-showcase/lib/room-categories')
    const groups = categorizeRoomGroups([
      photo('o1', 'other', null, 0),
      photo('o2', 'other', null, 1),
      photo('e1', 'exterior', 'Terrasse', 2),
      photo('b1', 'bedroom', 'Chambre 1', 3),
    ])
    expect(groups.map(group => [group.label, group.category, group.photos.length])).toEqual([
      ['Chambre 1', 'bedrooms', 1],
      ['Terrasse', 'exterior', 1],
      ['Autre', 'other', 2],
    ])
  })

  it('a sa pill « Autre », en dernier, seulement si le logement en a', () => {
    const { unmount } = render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={[photo('o1', 'other', null, 0), photo('k', 'kitchen', null, 1)]} />)
    const pills = screen.getAllByRole('button').map(button => button.textContent?.trim()).filter(text => ['Tout', 'Cuisine', 'Autre'].includes(text ?? ''))
    expect(pills).toEqual(['Tout', 'Cuisine', 'Autre'])
    unmount()

    render(<LodgingRoomsGrid lodgingTitle="Chalet" photos={[photo('k', 'kitchen', null, 0), photo('e', 'exterior', null, 1)]} />)
    expect(screen.queryByRole('button', { name: 'Autre' })).not.toBeInTheDocument()
  })
})
