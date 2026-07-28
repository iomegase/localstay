/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideAccordions } from '@/app/(public)/le-logement/_components/GuideAccordions'
import { DepartureChecklist } from '@/app/(public)/le-logement/_components/DepartureChecklist'

const SECTIONS = [
  { key: 'access', title: 'Accéder au logement', subtitle: 'Adresse et accès', icon: null, accent: 'orange' as const, content: <p>Contenu accès</p> },
  { key: 'discover', title: 'Découvrir le logement', subtitle: 'Équipements', icon: null, accent: 'green' as const, content: <p>Contenu découverte</p> },
]

describe('/le-logement — accordéons du guide', () => {
  it('renders every section collapsed by default', () => {
    render(<GuideAccordions sections={SECTIONS} />)

    expect(screen.getByRole('button', { name: /Accéder au logement/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /Découvrir le logement/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens a section with the keyboard (Entrée)', async () => {
    const user = userEvent.setup()
    render(<GuideAccordions sections={SECTIONS} />)

    const first = screen.getByRole('button', { name: /Accéder au logement/i })
    first.focus()
    expect(first).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(first).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps a single section open at a time', async () => {
    const user = userEvent.setup()
    render(<GuideAccordions sections={SECTIONS} />)

    const first = screen.getByRole('button', { name: /Accéder au logement/i })
    const second = screen.getByRole('button', { name: /Découvrir le logement/i })

    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'false')

    await user.click(second)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')
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
