/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideMenuOverlay } from '@/features/guide-app/components/GuideMenuOverlay'

it('054 menu: shows the two text destinations and a large close control', () => {
  const onNavigate = jest.fn()
  const onClose = jest.fn()
  render(<GuideMenuOverlay open onClose={onClose} onNavigate={onNavigate} />)
  const menu = screen.getByRole('navigation', { name: 'Menu du guide' })
  const buttons = within(menu).getAllByRole('button')
  expect(buttons).toHaveLength(2)
  expect(buttons[0]).toHaveAccessibleName('Les logements')
  expect(buttons[1]).toHaveAccessibleName('Journal')
  expect(menu.querySelector('svg, img')).toBeNull()
  expect(screen.queryByText('Nous contacter')).not.toBeInTheDocument()
  const close = screen.getByRole('button', { name: 'Fermer le menu' })
  // 054 AC-01-15 (PO 2026-10-04) : sans fond.
  expect(close).toHaveClass('h-14', 'w-14')
  expect(close.className).not.toMatch(/\bbg-/)
  fireEvent.click(buttons[0])
  expect(onNavigate).toHaveBeenCalledWith('lodgings')
  fireEvent.click(buttons[1])
  expect(onNavigate).toHaveBeenCalledWith('blog')
  fireEvent.click(close)
  expect(onClose).toHaveBeenCalledTimes(3)
})
