/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { DepartureChecklist } from '@/features/guide-app/components/DepartureChecklist'

describe('039-private-guide-departure checklist', () => {
  it('updates checkbox state and progress locally', () => {
    render(
      <DepartureChecklist
        items={['Vider le réfrigérateur', 'Fermer les fenêtres']}
      />,
    )

    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    const first = screen.getByRole('checkbox', {
      name: 'Vider le réfrigérateur',
    })
    fireEvent.click(first)

    expect(first).toBeChecked()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Progression des consignes de départ',
      }),
    ).toHaveAttribute('aria-valuenow', '1')
  })
})
