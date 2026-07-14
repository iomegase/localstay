/** @jest-environment jsdom */

import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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
    expect(screen.getByText('Distance parcourue')).toBeInTheDocument()
    expect(screen.getByText('Durée')).toBeInTheDocument()
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
    expect(screen.getByText('Dénivelé positif')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voir le tracé' }))

    expect(onViewTrail).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Quitter la rando' })).toHaveAttribute(
      'href',
      '/guide/megeve/rando/mont-joux',
    )
  })

  it('moves focus into the modal and traps keyboard navigation between its actions', async () => {
    const user = userEvent.setup()

    render(
      <TrailSessionSummaryModal
        summary={{
          distanceM: 900,
          durationSeconds: 600,
          elevationGainM: null,
        }}
        onViewTrail={jest.fn()}
      />,
    )

    const viewTrail = screen.getByRole('button', { name: 'Voir le tracé' })
    const exitTrail = screen.getByRole('link', { name: 'Quitter la rando' })

    await waitFor(() => expect(viewTrail).toHaveFocus())

    await user.tab()
    expect(exitTrail).toHaveFocus()

    await user.tab()
    expect(viewTrail).toHaveFocus()

    await user.tab({ shift: true })
    expect(exitTrail).toHaveFocus()
  })

  it('invokes the parent exit callback when provided', async () => {
    const user = userEvent.setup()
    const onExit = jest.fn()

    render(
      <TrailSessionSummaryModal
        summary={{
          distanceM: 900,
          durationSeconds: 600,
          elevationGainM: null,
        }}
        onViewTrail={jest.fn()}
        onExit={onExit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Quitter la rando' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('restores focus after the parent unmounts it from the view-trail action', async () => {
    const user = userEvent.setup()

    function ModalHarness() {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Ouvrir le récapitulatif
          </button>
          {isOpen ? (
            <TrailSessionSummaryModal
              summary={{
                distanceM: 900,
                durationSeconds: 600,
                elevationGainM: null,
              }}
              onViewTrail={() => setIsOpen(false)}
            />
          ) : null}
        </>
      )
    }

    render(<ModalHarness />)

    const opener = screen.getByRole('button', { name: 'Ouvrir le récapitulatif' })
    await user.click(opener)

    const viewTrail = screen.getByRole('button', { name: 'Voir le tracé' })
    await waitFor(() => expect(viewTrail).toHaveFocus())
    await user.click(viewTrail)

    await waitFor(() => expect(opener).toHaveFocus())
  })
})
