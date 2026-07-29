/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp demo visual polish', () => {
  it('shows the arrival time and a wifi icon on the home shortcuts', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )

    const arrival = screen.getByRole('button', { name: /arrivée 16:00/i })
    expect(within(arrival).getByText('16:00')).toBeInTheDocument()

    const wifi = screen.getByRole('button', { name: /wi-fi refuge-mont-blanc/i })
    expect(within(wifi).getByTestId('wifi-icon')).toBeInTheDocument()
  })
})
