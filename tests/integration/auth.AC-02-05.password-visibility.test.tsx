/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '@/features/auth/components/LoginPage'

it('AC-02-05: toggles password visibility with click and keyboard without changing or submitting it', async () => {
  const user = userEvent.setup()
  const originalFetch = global.fetch
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  try {
    render(<LoginPage />)
    const password = screen.getByLabelText('Mot de passe')
    await user.type(password, 'Example-password-42!')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('Example-password-42!')
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('Example-password-42!')
    expect(fetchMock).not.toHaveBeenCalled()
  } finally {
    global.fetch = originalFetch
  }
})
