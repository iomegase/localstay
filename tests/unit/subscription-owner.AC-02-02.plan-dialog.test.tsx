/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SubscriptionPlanGrid } from '@/features/subscription-owner/components/SubscriptionPlanGrid'
import { OWNER_PLAN_CATALOG } from '@/features/subscription-owner/plans'

describe('013 subscription plan grid', () => {
  it('AC-02-01/02-02: shows indicative plans and an informational dialog without payment', async () => {
    const user = userEvent.setup()

    render(<SubscriptionPlanGrid plans={OWNER_PLAN_CATALOG} trialEndsAt="2027-05-24T00:00:00.000Z" />)

    expect(screen.getByText(/Prix indicatifs non contractuels/i)).toBeInTheDocument()
    expect(screen.getByText('Découverte')).toBeInTheDocument()
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Conciergerie')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Choisir ce plan/i })[1])

    expect(screen.getByRole('dialog')).toHaveTextContent(
      /La facturation démarrera seulement à la fin de votre période gratuite/i,
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(/Aucun paiement immédiat/i)
  })
})
