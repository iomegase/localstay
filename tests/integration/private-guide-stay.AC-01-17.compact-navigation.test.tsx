/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideNavigation } from '@/features/guide-app/components/GuideNavigation'

it('AC-01-17: keeps compact centered touch targets and reserves the system gesture area once', () => {
  const navigate = jest.fn()
  render(<GuideNavigation activeView="home" onNavigate={navigate} />)
  const nav = screen.getByRole('navigation', { name: 'Navigation du guide' })
  expect(nav).toHaveClass('pb-[max(4px,env(safe-area-inset-bottom))]')
  expect(nav.firstElementChild).toHaveClass('pt-1')
  expect(nav.firstElementChild).not.toHaveClass('py-3')
  const buttons = within(nav).getAllByRole('button')
  expect(buttons).toHaveLength(4)
  expect(buttons[0].parentElement).toHaveClass('h-12', 'items-stretch')
  for (const button of buttons) {
    expect(button).toHaveClass('min-h-[48px]', 'items-center', 'justify-center', 'gap-0.5')
    fireEvent.click(button)
  }
  expect(navigate.mock.calls.map(call => call[0])).toEqual(['home', 'favorites', 'map', 'help'])
})
