/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'

const mockFetch = jest.fn()
const originalFetch = global.fetch

beforeEach(() => { mockFetch.mockReset(); global.fetch = mockFetch })
afterAll(() => { global.fetch = originalFetch })

async function submitEmail() {
  const user = userEvent.setup()
  render(<ForgotPasswordPage />)
  await user.type(screen.getByLabelText('Adresse email'), 'owner@example.com')
  await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
}

it('AC-04-01: displays rate limit failure and permits retry instead of showing success', async () => {
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Trop de demandes. Réessayez plus tard.' } }) })
  await submitEmail()
  expect(await screen.findByRole('alert')).toHaveTextContent('Trop de demandes')
  expect(screen.queryByText('Vérifiez votre boîte mail')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Envoyer le lien' })).toBeEnabled()
})

it('AC-04-01: handles a network failure and restores the send button', async () => {
  mockFetch.mockRejectedValue(new Error('Network unavailable'))
  await submitEmail()
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible')
  expect(screen.getByRole('button', { name: 'Envoyer le lien' })).toBeEnabled()
})

it('AC-04-01: keeps the same neutral success for every accepted email request', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
  await submitEmail()
  expect(await screen.findByText('Vérifiez votre boîte mail')).toBeInTheDocument()
  expect(screen.getByText(/Si cet email existe/)).toBeInTheDocument()
})
