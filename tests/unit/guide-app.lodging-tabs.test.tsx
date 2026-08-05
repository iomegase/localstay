/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideLodgingTabs } from '@/features/guide-app/components/GuideLodgingTabs'

describe('GuideLodgingTabs', () => {
  it('renders the four category pills', () => {
    render(<GuideLodgingTabs view="arrival" onNavigate={() => {}} />)
    for (const label of ['Accès', 'Infos', 'Consignes', 'Départ']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the pill matching the current view as current', () => {
    render(<GuideLodgingTabs view="rules" onNavigate={() => {}} />)
    expect(screen.getByRole('button', { name: 'Consignes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Accès' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('navigates to the mapped view when a pill is clicked', () => {
    const onNavigate = jest.fn()
    render(<GuideLodgingTabs view="arrival" onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Départ' }))
    expect(onNavigate).toHaveBeenCalledWith('departure')

    fireEvent.click(screen.getByRole('button', { name: 'Infos' }))
    expect(onNavigate).toHaveBeenCalledWith('practical')
  })
})
