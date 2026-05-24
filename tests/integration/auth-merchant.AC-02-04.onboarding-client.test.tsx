/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MerchantOnboardingClient } from '@/features/merchant/components/MerchantOnboardingClient'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

global.fetch = jest.fn()

describe('014 merchant onboarding client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC-02-04: shows an explicit empty state when search returns no POI', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    const user = userEvent.setup()
    render(<MerchantOnboardingClient />)

    await user.type(screen.getByPlaceholderText('Nom ou adresse de votre établissement'), 'brasserie du mont blanc')
    await user.click(screen.getByRole('button', { name: 'Rechercher' }))

    await waitFor(() => expect(screen.getByText(/Aucun établissement trouvé/i)).toBeInTheDocument())
  })
})
