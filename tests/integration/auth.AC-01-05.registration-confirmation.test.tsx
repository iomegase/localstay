/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '@/app/auth/register/page'

const mockPush = jest.fn()
const mockFetch = jest.fn()
const originalFetch = global.fetch
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
beforeEach(() => { jest.clearAllMocks(); global.fetch = mockFetch })
afterAll(() => { global.fetch = originalFetch })

async function submitRegistration() {
  const user = userEvent.setup()
  render(<RegisterPage />)
  await user.type(screen.getByLabelText('Prénom'), 'Jean')
  await user.type(screen.getByLabelText('Nom'), 'Dupont')
  await user.type(screen.getByLabelText('Adresse email'), 'owner@example.com')
  await user.type(screen.getByLabelText('Mot de passe'), 'password123')
  await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))
}

it('AC-01-05: registration awaiting confirmation shows the next step without navigating into a protected dashboard', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ confirmation_required: true, redirect_to: '/dashboard' }) })
  await submitRegistration()
  expect(await screen.findByText('Confirmez votre adresse email')).toBeInTheDocument()
  expect(screen.getByText('owner@example.com')).toBeInTheDocument()
  expect(mockPush).not.toHaveBeenCalled()
})

it('AC-01-01: an immediate session still redirects to the dashboard', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ confirmation_required: false, redirect_to: '/dashboard' }) })
  await submitRegistration()
  expect(mockPush).toHaveBeenCalledWith('/dashboard')
})

it('AC-01-05: a rejected email does not show a confirmation success', async () => {
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Impossible d’envoyer l’email de confirmation pour le moment.' } }) })
  await submitRegistration()
  expect(await screen.findByText(/Impossible d’envoyer/)).toBeInTheDocument()
  expect(screen.queryByText('Confirmez votre adresse email')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeEnabled()
})
