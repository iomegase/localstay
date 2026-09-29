/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from '@/app/auth/reset-password/page'

let mockSearchParams = new URLSearchParams()
const mockPush = jest.fn()
const mockFetch = jest.fn()
const originalFetch = global.fetch
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  jest.clearAllMocks()
  global.fetch = mockFetch
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
})
afterAll(() => { global.fetch = originalFetch })

it.each([
  { query: 'code=standard-code', credential: { code: 'standard-code' } },
  { query: 'token_hash=custom-token', credential: { token: 'custom-token' } },
])('AC-04-02: a valid $query link permits password submission', async ({ query, credential }) => {
  mockSearchParams = new URLSearchParams(query)
  const user = userEvent.setup()
  render(<ResetPasswordPage />)
  expect(screen.queryByText('Lien invalide ou expiré')).not.toBeInTheDocument()
  await user.type(screen.getByLabelText('Nouveau mot de passe'), 'newpassword123')
  await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'newpassword123')
  await user.click(screen.getByRole('button', { name: 'Définir le mot de passe' }))
  expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
    body: JSON.stringify({ ...credential, password: 'newpassword123' }),
  }))
  expect(mockPush).toHaveBeenCalledWith('/auth/login?reset=success')
})

it('AC-04-02: a link without a recovery credential cannot submit a new password', () => {
  render(<ResetPasswordPage />)
  expect(screen.getByRole('button', { name: 'Définir le mot de passe' })).toBeDisabled()
  expect(mockFetch).not.toHaveBeenCalled()
})
