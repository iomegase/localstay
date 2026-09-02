/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'

describe('public guide demo modal', () => {
  it('opens the autonomous guide in a smartphone dialog without changing the URL', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/')

    render(<GuideDemoLauncher />)

    const trigger = screen.getByRole('button', {
      name: 'Voir le guide d’exemple',
    })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', {
      name: 'Guide MyStay de démonstration',
    })
    expect(dialog).toHaveClass(
      'border-[5px]',
      'border-white',
      'rounded-[2.5rem]',
    )
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByTestId('autonomous-demo-guide')).toHaveAttribute(
      'data-guide-mode',
      'demo',
    )
    expect(
      screen.queryByRole('button', {
        name: 'Fermer le guide de démonstration',
      }),
    ).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('closes with Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<GuideDemoLauncher />)

    const trigger = screen.getByRole('button', {
      name: 'Voir le guide d’exemple',
    })
    await user.click(trigger)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })
})
