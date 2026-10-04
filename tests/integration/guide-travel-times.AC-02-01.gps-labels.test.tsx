/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideLocationToggle } from '@/features/guide-app/components/stay/GuideLocationToggle'

const noop = () => undefined

it('AC-02-01 (PO 2026-10-04): a single « GPS » switch whose position reflects the state', () => {
  const onClear = jest.fn()
  const onRequest = jest.fn()
  const { rerender } = render(<GuideLocationToggle active loading={false} denied={false} onRequest={onRequest} onClear={onClear} />)
  const gpsSwitch = screen.getByRole('switch', { name: 'GPS' })
  expect(gpsSwitch).toHaveAttribute('aria-checked', 'true')
  expect(gpsSwitch.closest('div')?.querySelector('svg.lucide-locate-fixed')).toHaveAttribute('stroke-width', '1')
  for (const legacy of ['GPS activé', 'GPS désactivé', 'Activer le GPS', 'Désactiver le GPS']) {
    expect(screen.queryByText(legacy)).toBeNull()
  }
  fireEvent.click(gpsSwitch)
  expect(onClear).toHaveBeenCalledTimes(1)
  expect(onRequest).not.toHaveBeenCalled()

  rerender(<GuideLocationToggle active={false} loading={false} denied={false} onRequest={onRequest} onClear={onClear} />)
  expect(screen.getByRole('switch', { name: 'GPS' })).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(screen.getByRole('switch', { name: 'GPS' }))
  expect(onRequest).toHaveBeenCalledTimes(1)
})

it('AC-02-01: disables the switch while locating', () => {
  render(<GuideLocationToggle active={false} loading denied={false} onRequest={noop} onClear={noop} />)
  const gpsSwitch = screen.getByRole('switch', { name: 'Localisation…' })
  expect(gpsSwitch).toBeDisabled()
  expect(gpsSwitch).toHaveAttribute('aria-checked', 'false')
})

it('AC-02-01: keeps the switch off and explains a refusal', () => {
  const onRequest = jest.fn()
  render(<GuideLocationToggle active={false} loading={false} denied onRequest={onRequest} onClear={noop} />)
  expect(screen.getByText('Position non disponible.')).toBeInTheDocument()
  const gpsSwitch = screen.getByRole('switch', { name: 'GPS' })
  expect(gpsSwitch).toHaveAttribute('aria-checked', 'false')
  expect(gpsSwitch).toBeEnabled()
  fireEvent.click(gpsSwitch)
  expect(onRequest).toHaveBeenCalledTimes(1)
})
