/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { isGuideMenuEnabled } from '@/features/guide-app/lib/guide-menu-visibility'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('034 BR-13 — visibilité temporaire du menu GuideApp', () => {
  it('active le menu dans tous les environnements, production comprise (BR-13 amendée le 2026-10-02)', () => {
    const previous = process.env.NODE_ENV
    Object.assign(process.env, { NODE_ENV: 'production' })
    try {
      expect(isGuideMenuEnabled()).toBe(true)
    } finally {
      Object.assign(process.env, { NODE_ENV: previous })
    }
  })

  it('conserve le burger et l’overlay lorsque le menu est activé', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        menuEnabled
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByTestId('guide-menu-overlay')).toBeInTheDocument()
  })

  it('ne rend ni burger ni overlay lorsque le menu est désactivé', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        menuEnabled={false}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Ouvrir le menu' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('guide-menu-overlay')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Accueil du guide' }),
    ).toBeInTheDocument()
  })
})

