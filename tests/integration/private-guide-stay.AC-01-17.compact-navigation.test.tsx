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

it('AC-01-20: renders four centered icons with the settings stroke and accessible names', () => {
  render(<GuideNavigation activeView="home" onNavigate={jest.fn()} />)
  const buttons = within(screen.getByRole('navigation')).getAllByRole('button')
  expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual([
    'Accueil', 'Coups de cœur', 'Carte', 'Réglages et infos',
  ])
  for (const button of buttons) {
    expect(button).toHaveClass('items-center', 'justify-center')
    expect(button.textContent).toBe('')
    expect(button.children).toHaveLength(1)
    expect(button.querySelector('svg')?.parentElement).toHaveClass('h-7', 'items-center', 'justify-center')
    expect(button.querySelector('svg')).toHaveAttribute('stroke-width', '1')
  }
})

it('AC-01-19: centers the unfilled pink heart in its button in both states', () => {
  const { rerender } = render(<GuideNavigation activeView="home" onNavigate={jest.fn()} />)
  for (const view of ['home', 'favorites'] as const) {
    rerender(<GuideNavigation activeView={view} onNavigate={jest.fn()} />)
    const button = screen.getByRole('button', { name: 'Coups de cœur' })
    expect(button).toHaveClass('items-center', 'justify-center')
    expect(button.children).toHaveLength(1)
    expect(button.querySelector('svg')).toHaveClass('text-pink-600', 'fill-none')
    expect(button.querySelector('svg')).not.toHaveClass('fill-current')
  }
})
