/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideFavoriteBentoCard } from '@/features/guide-app/components/GuideFavoriteBentoCard'
import type { GuidePoi } from '@/features/guide-app/types'

const basePoi: GuidePoi = {
  id: 'poi-1',
  name: 'Chalet du Mont',
  slug: 'chalet-du-mont',
  category: { slug: 'rando', name: 'Randonnée', icon: 'mountain', color: '#4d7c0f' },
  description: 'desc',
  shortDescription: 'short',
  photos: ['https://cdn.test/real.jpg'],
  latitude: 45.8,
  longitude: 6.7,
  address: 'Saint-Gervais',
  distanceLabel: '1,2 km',
  durationLabel: '15 min',
  recommended: true,
  familyFriendly: true,
  nearby: true,
  isOpenNow: true,
  directionsUrl: 'https://maps.example/itineraire',
}

describe('GuideFavoriteBentoCard', () => {
  it('is visible immediately without waiting for a viewport observer', () => {
    render(
      <GuideFavoriteBentoCard
        poi={basePoi}
        variant="big"
        onSelectPoi={jest.fn()}
        onShowOnMap={jest.fn()}
      />,
    )

    expect(screen.getByTestId('favorite-bento-card')).toBeVisible()
  })

  it('opens the internal POI sheet on the primary action without any link', () => {
    const onSelectPoi = jest.fn()
    const onShowOnMap = jest.fn()
    const { container } = render(
      <GuideFavoriteBentoCard poi={basePoi} variant="big" onSelectPoi={onSelectPoi} onShowOnMap={onShowOnMap} />,
    )

    // Aucune navigation privée : pas de <a href>
    expect(container.querySelector('a')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Chalet du Mont' }))
    expect(onSelectPoi).toHaveBeenCalledWith(basePoi)
    expect(onShowOnMap).not.toHaveBeenCalled()
  })

  it('opens the internal map view on the icon-only Carte action', () => {
    const onSelectPoi = jest.fn()
    const onShowOnMap = jest.fn()
    render(
      <GuideFavoriteBentoCard poi={basePoi} variant="compact" onSelectPoi={onSelectPoi} onShowOnMap={onShowOnMap} />,
    )

    const mapButton = screen.getByRole('button', { name: 'Voir Chalet du Mont sur la carte' })
    // Pill Carte : icône seule, aucun texte visible
    expect(mapButton.textContent?.trim()).toBe('')

    fireEvent.click(mapButton)
    expect(onShowOnMap).toHaveBeenCalledWith(basePoi)
    expect(onSelectPoi).not.toHaveBeenCalled()
  })

  it('never shows the category label nor preference/family badges, but shows the open status', () => {
    const { rerender } = render(
      <GuideFavoriteBentoCard poi={basePoi} variant="big" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )

    expect(screen.queryByText('Randonnée')).toBeNull()
    expect(screen.queryByText(/Notre préféré/i)).toBeNull()
    expect(screen.queryByText(/En famille/i)).toBeNull()
    expect(screen.queryByText(/À proximité/i)).toBeNull()
    expect(screen.getByTestId('favorite-open-status')).toHaveTextContent('Ouvert')

    rerender(
      <GuideFavoriteBentoCard poi={{ ...basePoi, isOpenNow: false }} variant="big" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.getByTestId('favorite-open-status')).toHaveTextContent('Fermé')

    rerender(
      <GuideFavoriteBentoCard poi={{ ...basePoi, isOpenNow: undefined }} variant="big" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.queryByTestId('favorite-open-status')).toBeNull()
  })

  it('hides the vague "Demi-journée" duration but keeps precise durations', () => {
    const { rerender } = render(
      <GuideFavoriteBentoCard poi={{ ...basePoi, durationLabel: 'Demi-journée' }} variant="compact" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.queryByText('Demi-journée')).toBeNull()

    rerender(
      <GuideFavoriteBentoCard poi={{ ...basePoi, durationLabel: '1 h 30' }} variant="compact" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.getByText('1 h 30')).toBeInTheDocument()
  })

  it('renders a full-frame square image and swaps to the category fallback on load error', () => {
    const { container } = render(
      <GuideFavoriteBentoCard poi={basePoi} variant="compact" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )

    const card = screen.getByTestId('favorite-bento-card')
    expect(card).toHaveClass('aspect-square')
    expect(card).not.toHaveClass('bg-white')

    const img = container.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://cdn.test/real.jpg')
    expect(img.className).toContain('object-cover')

    fireEvent.error(img)
    expect(img.getAttribute('src')).toMatch(/^\/fallback\//)
  })

  it('spans two columns only for the big variant', () => {
    const { rerender } = render(
      <GuideFavoriteBentoCard poi={basePoi} variant="big" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.getByTestId('favorite-bento-card')).toHaveClass('col-span-2')

    rerender(
      <GuideFavoriteBentoCard poi={basePoi} variant="compact" onSelectPoi={jest.fn()} onShowOnMap={jest.fn()} />,
    )
    expect(screen.getByTestId('favorite-bento-card')).not.toHaveClass('col-span-2')
  })
})
