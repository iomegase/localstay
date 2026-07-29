/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp demo visual polish', () => {
  it('uses neutral slate colors for the arrival and Wi-Fi shortcuts', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    for (const name of [/arrivée dès 16:00/i, /wi-fi refuge-mont-blanc/i]) {
      const button = screen.getByRole('button', { name })
      const icon = button.querySelector('[data-testid="quick-card-icon"]')

      expect(icon).toHaveClass('bg-slate-100', 'text-slate-600')
      expect(icon).not.toHaveClass('bg-pink-50', 'text-pink-600')
    }
  })
})
