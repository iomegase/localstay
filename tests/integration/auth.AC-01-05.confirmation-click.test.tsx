/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmRegistrationPage from '@/app/auth/confirm-registration/page'
const mockPush = jest.fn()
const mockFetch = jest.fn()
const originalFetch = global.fetch
let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), useSearchParams: () => mockSearchParams }))
beforeEach(() => { jest.clearAllMocks(); global.fetch = mockFetch; mockSearchParams = new URLSearchParams('token_hash=test-signup-token') })
afterAll(() => { global.fetch = originalFetch })

it('AC-01-05: previewing the confirmation page does not consume the token, and a click verifies it', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ redirect_to: '/dashboard' }) })
  const user = userEvent.setup()
  render(<ConfirmRegistrationPage />)
  expect(mockFetch).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirmer mon adresse email' }))
  expect(mockFetch).toHaveBeenCalledWith('/api/auth/confirm-registration', expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'test-signup-token' }) }))
  expect(mockPush).toHaveBeenCalledWith('/dashboard')
})

it('AC-01-05: missing credentials cannot trigger confirmation', () => {
  mockSearchParams = new URLSearchParams()
  render(<ConfirmRegistrationPage />)
  expect(screen.getByRole('button', { name: 'Confirmer mon adresse email' })).toBeDisabled()
})

it('AC-01-05: an expired link shows a French error instead of opening a protected space', async () => {
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Lien de confirmation invalide ou expiré' } }) })
  const user = userEvent.setup()
  render(<ConfirmRegistrationPage />)
  await user.click(screen.getByRole('button', { name: 'Confirmer mon adresse email' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Lien de confirmation invalide ou expiré')
  expect(mockPush).not.toHaveBeenCalled()
})
