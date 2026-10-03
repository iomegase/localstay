/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { GuideDepartureView } from '@/features/guide-app/components/stay/GuideDepartureView'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { FIXED_HOUSE_RULES } from '@/features/guide-app/lib/fixed-lodging-content'
import { buildStayLodging } from '../support/guide-stay-lodging'

describe('054 US-03/US-04 — departure and house guide', () => {
  it('AC-04-02 / AC-03-02: shows progress, checklist and the departure signal', async () => {
    const onToggle = jest.fn()
    const onDeparted = jest.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <GuideDepartureView
        lodging={buildStayLodging()}
        checked={new Set([0])}
        onToggle={onToggle}
        departed={false}
        onDeparted={onDeparted}
        onBack={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Départ' })).toBeInTheDocument()
    expect(screen.getByText('Avant 10 h')).toBeInTheDocument()
    expect(screen.getByText('1 sur 2 faits')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('checkbox', { name: 'Fermer les fenêtres' })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sortir les poubelles' }))
    expect(onToggle).toHaveBeenCalledWith(1)

    expect(screen.getByText('Encore 1 tâche — vous pouvez quand même partir')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Je suis parti·e' }))
    })
    expect(onDeparted).toHaveBeenCalledTimes(1)

    rerender(
      <GuideDepartureView
        lodging={buildStayLodging()}
        checked={new Set([0, 1])}
        onToggle={onToggle}
        departed={false}
        onDeparted={onDeparted}
        onBack={jest.fn()}
      />,
    )
    expect(screen.getByText('La conciergerie sera prévenue')).toBeInTheDocument()

    rerender(
      <GuideDepartureView
        lodging={buildStayLodging()}
        checked={new Set([0, 1])}
        onToggle={onToggle}
        departed
        onDeparted={onDeparted}
        onBack={jest.fn()}
      />,
    )
    expect(screen.getByText("Merci d'avoir séjourné au 305 !")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Je suis parti·e' })).not.toBeInTheDocument()
  })

  it('AC-04-01: lists equipment and shows rules as a single-open accordion', () => {
    render(
      <GuideHouseGuide
        lodging={buildStayLodging({ houseRules: [...FIXED_HOUSE_RULES] })}
        onBack={jest.fn()}
        showPracticalInfo
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Guide logement' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Équipements' })).toBeInTheDocument()
    expect(screen.getByText('Cheminée')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Règlement' })).toBeInTheDocument()

    const first = screen.getByRole('button', { name: /respect du logement/i })
    const second = screen.getByRole('button', { name: /calme et voisinage/i })
    expect(first).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')

    expect(screen.getByRole('link', { name: /Urgences 112/ })).toHaveAttribute('href', 'tel:112')
    expect(screen.getByRole('link', { name: /Conciergerie \+33 6 07 85 90 58/ })).toHaveAttribute('href', 'tel:+33607859058')
    expect(screen.queryByText(/tri des déchets/i)).not.toBeInTheDocument()
  })
})
