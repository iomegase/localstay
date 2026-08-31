/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp demo visual polish', () => {
  it('shows an épurée home with the welcome title and the two shortcuts only', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /bienvenue au 305/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /explorer saint-gervais/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /découvrir le livret/i }),
    ).toBeInTheDocument()

    // La home épurée ne montre plus les raccourcis Arrivée / Wi-Fi.
    expect(
      screen.queryByRole('button', { name: /arrivée 16:00/i }),
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /découvrir le livret/i }),
    )

    expect(
      screen.getByRole('button', { name: 'Arrivée 16:00' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Départ 10:00' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /accéder au logement/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /informations pratiques/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /équipements.*3 équipements/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /préparer le départ/i }),
    ).toBeInTheDocument()
  })
})
