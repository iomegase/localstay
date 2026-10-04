/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { GuideHeader } from '@/features/guide-app/components/GuideHeader'
import { GuideMenuOverlay } from '@/features/guide-app/components/GuideMenuOverlay'

it('AC-01-14: bouton menu en icône AlignRight (TextAlignEnd), centré sur la ligne du sélecteur, sans décalage', () => {
  render(<GuideHeader onOpenHome={jest.fn()} onOpenMenu={jest.fn()} localeSwitch />)
  const button = screen.getByTestId('guide-menu-icon')
  expect(button.querySelector('svg.lucide-text-align-end')).not.toBeNull()
  expect(button.querySelector('svg.lucide-menu')).toBeNull()
  expect(button.className).not.toMatch(/translate-[xy]/)
  expect(button).toHaveClass('h-11', 'w-11')
  expect(button.parentElement).toHaveClass('items-center')
})

it('AC-01-14: bouton fermer dans une rangée de 68 px, centré au même point que le bouton menu', () => {
  render(<GuideMenuOverlay open onClose={jest.fn()} onNavigate={jest.fn()} />)
  const close = screen.getByRole('button', { name: 'Fermer le menu' })
  expect(close).toHaveClass('h-14', 'w-14', 'bg-slate-50')
  // Centre du bouton menu : px-4 (16 px) + 22 px = 38 px du bord droit ; 56 px centrés à 38 px → marge 10 px.
  expect(close.parentElement).toHaveClass('h-[68px]', 'items-center', 'justify-end', 'pr-[10px]')
})
