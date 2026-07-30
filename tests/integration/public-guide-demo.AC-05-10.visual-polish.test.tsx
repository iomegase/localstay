/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
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
      screen.getByRole('heading', { name: /bienvenue au refuge du mont-blanc/i }),
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
  })
})
