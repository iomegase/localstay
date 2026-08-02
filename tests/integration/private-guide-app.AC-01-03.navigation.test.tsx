/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('034-private-guide-app route-aware shell', () => {
  beforeEach(() => mockPush.mockClear())

  it('uses private routes from the shared GuideApp home', () => {
    render(
      <GuideApp
        mode="private"
        lodging={{ ...demoLodging, name: 'Le Chalet Hygge' }}
        pois={[]}
        routes={{
          home: '/sejour',
          favorites: '/sejour/coups-de-coeur',
          lodging: '/le-logement',
          map: '/map',
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /explorer/i }))
    expect(mockPush).toHaveBeenCalledWith('/sejour/coups-de-coeur')

    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(mockPush).toHaveBeenCalledWith('/le-logement')
  })

  it('renders functional private menu links', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        routes={{ home: '/sejour', lodging: '/le-logement', map: '/map' }}
        menuItems={[
          { label: 'Bienvenue', href: '/sejour' },
          { label: 'Vos favoris', href: '/mes-favoris' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByRole('link', { name: 'Bienvenue' })).toHaveAttribute(
      'href',
      '/sejour',
    )
    expect(screen.getByRole('link', { name: 'Vos favoris' })).toHaveAttribute(
      'href',
      '/mes-favoris',
    )
  })
})
