/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingSectionNav } from '@/app/(public)/le-logement/_components/LodgingSectionNav'
import { DepartureChecklist } from '@/app/(public)/le-logement/_components/DepartureChecklist'

describe('/le-logement interactions', () => {
  it('links to the four sections in document order', () => {
    render(<LodgingSectionNav />)

    expect(screen.getByRole('link', { name: 'Bienvenue' })).toHaveAttribute('href', '#bienvenue')
    expect(screen.getByRole('link', { name: 'Infos pratiques' })).toHaveAttribute('href', '#infos-pratiques')
    expect(screen.getByRole('link', { name: 'Bon à savoir' })).toHaveAttribute('href', '#bon-a-savoir')
    expect(screen.getByRole('link', { name: 'Départ' })).toHaveAttribute('href', '#depart')
  })

  it('checks departure steps locally and updates progress', async () => {
    const user = userEvent.setup()
    render(<DepartureChecklist items={['Vider le réfrigérateur', 'Fermer les fenêtres']} />)

    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    const first = screen.getByRole('checkbox', { name: 'Vider le réfrigérateur' })
    const second = screen.getByRole('checkbox', { name: 'Fermer les fenêtres' })

    await user.click(first)

    expect(first).toBeChecked()
    expect(second).not.toBeChecked()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })
})
