/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideStayScreen } from '@/features/guide-app/components/stay/GuideStayScreen'

it.each(['Arrivée', 'Départ', 'Guide logement', 'Se déplacer'])(
  'AC-01-13: places %s beside the return button and keeps its subtitle below',
  title => {
    const onBack = jest.fn()
    render(<GuideStayScreen title={title} subtitle="Sous-titre" onBack={onBack}>Contenu</GuideStayScreen>)
    const heading = screen.getByRole('heading', { level: 1, name: title })
    const back = screen.getByRole('button', { name: 'Revenir au séjour' })
    const header = heading.closest('header')
    expect(header).toHaveClass('flex', 'items-center', 'gap-3')
    expect(back.parentElement).toBe(header)
    expect(back).toHaveClass('h-11', 'w-11', 'shrink-0')
    expect(back.nextElementSibling).toBe(heading.parentElement)
    expect(heading.nextElementSibling).toBe(screen.getByText('Sous-titre'))
    expect(heading).not.toHaveClass('mt-5')
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  },
)
