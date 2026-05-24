/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

global.fetch = jest.fn()

describe('LoginPage redirect (AC-02-01)', () => {
  const originalLocation = window.location
  const assignMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ redirect_to: '/dashboard' }),
    })

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('AC-02-01: triggers a browser redirect to the owner dashboard after successful login', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'owner@staylocal.dev')
    await user.type(screen.getByLabelText('Mot de passe'), 'StayLocal2026!')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@staylocal.dev',
          password: 'StayLocal2026!',
        }),
      }),
    )

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/dashboard'))
    expect(mockPush).not.toHaveBeenCalled()
  })
})
