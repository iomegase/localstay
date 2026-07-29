/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp featured bento cards', () => {
  it('renders featured POIs as square image cards in a two-column grid', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    const grid = screen.getByTestId('guide-featured-grid')
    expect(grid).toHaveClass('grid', 'grid-cols-2')

    const cards = screen.getAllByTestId('guide-featured-card')
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card).toHaveClass('aspect-square', 'w-full', 'rounded-[24px]')
      expect(card).not.toHaveClass('bg-white')
    }

    const heroSource = decodeURIComponent(
      screen
        .getByRole('img', { name: 'Rond de Carotte' })
        .getAttribute('src') ?? '',
    )
    expect(heroSource).toBe(
      'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/pois/1782132327133.avif',
    )
  })

  it('opens the selected POI inside GuideApp without changing the URL', () => {
    window.history.replaceState({}, '', '/')
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Rond de Carotte' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })
})
