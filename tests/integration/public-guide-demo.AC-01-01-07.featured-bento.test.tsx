/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp featured bento cards', () => {
  it('renders three equally sized image cards in a scrollbar-free horizontal row', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    const carousel = screen.getByTestId('guide-featured-carousel')
    expect(carousel).toHaveClass(
      'overflow-x-auto',
      '[scrollbar-width:none]',
      '[&::-webkit-scrollbar]:hidden',
    )

    const cards = screen.getAllByTestId('guide-featured-card')
    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(card).toHaveClass(
        'h-[156px]',
        'w-[156px]',
        'aspect-square',
        'snap-start',
        'rounded-[24px]',
      )
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
