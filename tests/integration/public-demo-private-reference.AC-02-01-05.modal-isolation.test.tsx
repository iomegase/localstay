/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'

describe('045 AC-02-01/AC-02-05 — autonomous public demo modal isolation', () => {
  it('mounts an autonomous home without changing the URL or requesting data', async () => {
    const user = userEvent.setup()
    const fetchSpy = jest.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy
    window.history.replaceState({}, '', '/concept')

    try {
      render(<GuideDemoLauncher />)
      await user.click(
        screen.getByRole('button', { name: 'Voir le guide d’exemple' }),
      )

      const dialog = await screen.findByRole('dialog', {
        name: 'Guide MyStay de démonstration',
      })
      expect(screen.getByTestId('autonomous-demo-guide')).toHaveAttribute(
        'data-guide-mode',
        'demo',
      )
      expect(
        screen.getByRole('heading', { name: /bienvenue/i }),
      ).toBeInTheDocument()
      expect(dialog.querySelector('[data-testid="shared-guide-app"]')).toBeNull()
      expect(dialog.querySelector('[data-guide-mode="private"]')).toBeNull()
      expect(window.location.pathname).toBe('/concept')
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('closes with Escape, restores trigger focus, and starts from home after reopening', async () => {
    const user = userEvent.setup()
    render(<GuideDemoLauncher />)

    const trigger = screen.getByRole('button', {
      name: 'Voir le guide d’exemple',
    })
    await user.click(trigger)
    await user.click(
      screen.getByRole('button', { name: /découvrir le livret d['’]accueil/i }),
    )

    expect(await screen.findByTestId('demo-lodging-guide')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    expect(
      await screen.findByRole('heading', { name: /bienvenue/i }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('demo-lodging-guide')).not.toBeInTheDocument()
  })
})
