/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp demo navigation', () => {
  it('navigates through lodging and favorites without changing the URL', () => {
    window.history.replaceState({}, '', '/')

    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /bienvenue au refuge du mont-blanc/i }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Guide logement' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Le Refuge du Mont-Blanc' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /informations pratiques/i }),
    )
    expect(screen.getByText('Refuge-Mont-Blanc')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Coups de cœur' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Nos coups de cœur' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ouvrir rond de carotte/i }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('opens a complete POI sheet and keeps trail tracking disabled', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        initialView="favorites"
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ouvrir l’alpage de porcherey/i }),
    )

    expect(
      screen.getByRole('heading', { name: 'L’Alpage de Porcherey' }),
    ).toBeInTheDocument()
    expect(screen.getByText('8,3 km')).toBeInTheDocument()
    expect(screen.getByText('709 m')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /démarrer/i }),
    ).not.toBeInTheDocument()
  })
})
