/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MerchantOnboardingClient } from '@/features/merchant/components/MerchantOnboardingClient'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

describe('018 merchant missing POI onboarding UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
  })

  it('AC-03-01: shows missing POI form after a search without satisfactory result', async () => {
    const user = userEvent.setup()
    render(<MerchantOnboardingClient />)

    await user.type(screen.getByPlaceholderText(/Nom ou adresse/i), 'brasserie introuvable')
    await user.click(screen.getByRole('button', { name: 'Rechercher' }))

    expect(await screen.findByRole('button', { name: /Mon établissement n'apparaît pas/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Mon établissement n'apparaît pas/i }))

    await waitFor(() => expect(screen.getByLabelText('Nom de l’établissement')).toBeInTheDocument())
    expect(screen.getByLabelText('Adresse complète')).toBeInTheDocument()
  })
})
