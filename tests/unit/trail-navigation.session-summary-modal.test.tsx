/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrailSessionSummaryModal } from '@/features/trail-navigation/components/TrailSessionSummaryModal'

describe('TrailSessionSummaryModal', () => {
  it('shows formatted distance and duration without unavailable metrics', () => {
    render(
      <TrailSessionSummaryModal
        summary={{
          distanceM: 1245,
          durationSeconds: 3661,
          elevationGainM: null,
        }}
        onViewTrail={jest.fn()}
        exitHref="/guide/megeve/rando/mont-joux"
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Randonnée terminée' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1,25 km')).toBeInTheDocument()
    expect(screen.getByText('1 h 01 min')).toBeInTheDocument()
    expect(screen.queryByText(/dénivelé/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/n\/a/i)).not.toBeInTheDocument()
  })

  it('shows elevation and exposes trail and exit actions', async () => {
    const user = userEvent.setup()
    const onViewTrail = jest.fn()

    render(
      <TrailSessionSummaryModal
        summary={{
          distanceM: 900,
          durationSeconds: 600,
          elevationGainM: 42,
        }}
        onViewTrail={onViewTrail}
        exitHref="/guide/megeve/rando/mont-joux"
      />,
    )

    expect(screen.getByText('42 m')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voir le tracé' }))

    expect(onViewTrail).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Quitter la rando' })).toHaveAttribute(
      'href',
      '/guide/megeve/rando/mont-joux',
    )
  })
})
