/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'
import { buildStayLodging } from '../support/guide-stay-lodging'

beforeEach(() => { window.localStorage.clear() })

it('AC-01-07: requests GPS only after opt-in, shares its position locally and clears it on disable', () => {
  let success: PositionCallback | undefined
  const getCurrentPosition = jest.fn((callback: PositionCallback) => { success = callback })
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
  render(<GuideHelpView lodging={buildStayLodging()} />)
  expect(getCurrentPosition).not.toHaveBeenCalled()
  const toggle = screen.getByRole('switch', { name: 'Activer votre GPS' })
  expect(toggle).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(toggle)
  expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  expect(toggle).toBeDisabled()
  act(() => success?.({ coords: { latitude: 45.8, longitude: 6.7 } } as GeolocationPosition))
  expect(toggle).toHaveAttribute('aria-checked', 'true')
  expect(window.localStorage.getItem('mystay:user-location')).toContain('45.8')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-checked', 'false')
  expect(window.localStorage.getItem('mystay:user-location')).toBeNull()
})

it('AC-01-07: keeps the switch off after permission denial', () => {
  const getCurrentPosition = jest.fn((_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError))
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
  render(<GuideHelpView lodging={buildStayLodging()} />)
  fireEvent.click(screen.getByRole('switch', { name: 'Activer votre GPS' }))
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByText(/Accès refusé/)).toBeInTheDocument()
})

it('AC-01-07: explains unavailable geolocation', () => {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined })
  render(<GuideHelpView lodging={buildStayLodging()} />)
  fireEvent.click(screen.getByRole('switch', { name: 'Activer votre GPS' }))
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByText(/Géolocalisation indisponible/)).toBeInTheDocument()
})

it('AC-01-08: opens an informational modal and restores focus on dismiss', async () => {
  const user = userEvent.setup()
  render(<GuideHelpView lodging={buildStayLodging()} demo />)
  const trigger = screen.getByRole('button', { name: 'Installer le guide' })
  await user.click(trigger)
  expect(screen.getByRole('dialog', { name: 'Installer le guide' })).toBeInTheDocument()
  expect(screen.getByText(/Votre position reste sur votre appareil/)).toHaveTextContent(/L’installation est à venir, avec une désactivation prévue après 7 jours/)
  await user.click(screen.getByRole('button', { name: 'J’ai compris' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
  await user.click(trigger)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('AC-01-01: shows only a Settings icon with an accessible name', () => {
  render(<GuideNavigation activeView="help" onNavigate={jest.fn()} />)
  const tab = screen.getByRole('button', { name: 'Réglages et infos' })
  expect(tab.textContent).toBe('')
  expect(tab.querySelector('svg.lucide-settings')).toHaveAttribute('stroke-width', '1')
  expect(tab).toHaveAttribute('aria-current', 'page')
})
