/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('GuideApp favorites sticky filters', () => {
  it('keeps category filters sticky below the GuideApp header', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))

    expect(screen.getByLabelText('Filtrer les catégories')).toHaveClass(
      'sticky',
      'top-0',
      'z-20',
      'bg-white/95',
      'backdrop-blur-xl',
      'overflow-x-auto',
      '[scrollbar-width:none]',
      '[&::-webkit-scrollbar]:hidden',
    )
  })
})
