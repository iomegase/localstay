/** @jest-environment jsdom */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
      expect(dialog).toHaveClass(
        'border-[5px]',
        'border-white',
        'rounded-[2.5rem]',
        'w-[min(430px,calc(100vw-24px))]',
        'h-[min(820px,calc(100vh-32px))]',
        'shadow-[0_35px_120px_rgba(15,23,42,0.55)]',
      )
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      const overlay = Array.from(
        document.querySelectorAll<HTMLElement>('[data-state="open"]'),
      ).find(
        element =>
          element !== dialog &&
          element.classList.contains('fixed') &&
          element.classList.contains('inset-0'),
      )
      expect(overlay).toBeDefined()
      expect(overlay).toHaveClass('bg-slate-950/30', 'backdrop-blur-lg')
      expect(
        within(dialog).queryByRole('button', { name: /fermer/i }),
      ).toBeNull()
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

  it('BR-11 keeps focus and page scrolling inside the outer dialog and closes from its overlay', async () => {
    const user = userEvent.setup()
    render(<GuideDemoLauncher />)

    const trigger = screen.getByRole('button', {
      name: 'Voir le guide d’exemple',
    })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', {
      name: 'Guide MyStay de démonstration',
    })
    const initialFocusTarget = within(dialog).getByRole('button', {
      name: 'Accueil du guide',
    })
    await waitFor(() => {
      expect(initialFocusTarget).toHaveFocus()
    })
    expect(document.body).toHaveClass('overflow-hidden')

    const controls = within(dialog).getAllByRole('button')
    controls.at(-1)?.focus()
    await user.tab()
    await waitFor(() => {
      expect(initialFocusTarget).toHaveFocus()
    })

    controls[0]?.focus()
    await user.tab({ shift: true })
    await waitFor(() => {
      expect(controls.at(-1)).toHaveFocus()
    })

    const overlay = Array.from(
      document.querySelectorAll<HTMLElement>('[data-state="open"]'),
    ).find(
      element =>
        element !== dialog &&
        element.classList.contains('fixed') &&
        element.classList.contains('inset-0'),
    )
    expect(overlay).toBeDefined()
    expect(overlay).toHaveClass('bg-slate-950/30', 'backdrop-blur-lg')
    await user.click(overlay as HTMLElement)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(document.body).not.toHaveClass('overflow-hidden')
    await waitFor(() => {
      expect(trigger).toHaveFocus()
    })
  })

  it('preserves the full URL through internal demo navigation', async () => {
    const user = userEvent.setup()
    const originalFetch = globalThis.fetch
    const fetchSpy = jest.fn()
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, 'send')
    const beaconDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      'sendBeacon',
    )
    const sendBeaconSpy = jest.fn()
    window.history.replaceState({}, '', '/concept?preview=demo#guide')
    const expectedHref = window.location.href
    globalThis.fetch = fetchSpy
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeaconSpy,
    })

    try {
      render(<GuideDemoLauncher />)
      await user.click(
        screen.getByRole('button', { name: 'Voir le guide d’exemple' }),
      )
      await user.click(screen.getByRole('button', { name: 'Coups de cœur' }))
      expect(
        await screen.findByRole('heading', { name: 'Nos coups de cœur' }),
      ).toBeInTheDocument()
      expect(window.location.href).toBe(expectedHref)

      await user.click(
        screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
      )
      expect(
        await screen.findByRole('heading', { name: 'Rond de Carotte' }),
      ).toBeInTheDocument()
      expect(window.location.href).toBe(expectedHref)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
      sendSpy.mockRestore()
      if (beaconDescriptor) {
        Object.defineProperty(navigator, 'sendBeacon', beaconDescriptor)
      } else {
        Reflect.deleteProperty(navigator, 'sendBeacon')
      }
    }
  })
})
