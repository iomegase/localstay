/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { GUIDE_CARD } from '@/features/guide-app/components/GuideCard'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

describe('050 private guide card design', () => {
  it('uses the shared light card design for practical contacts', () => {
    render(<GuideHouseGuide lodging={demoLodging} onBack={jest.fn()} showPracticalInfo />)

    for (const testId of ['guide-practical-emergency', 'guide-practical-concierge']) {
      const card = screen.getByTestId(testId)
      expect(card).toHaveAttribute('data-guide-card', 'true')
      expect(card).toHaveClass(...GUIDE_CARD.split(' '))
    }
  })

  it('shows equipment images without a lightbox and keeps phone actions', () => {
    const lodging = {
      ...demoLodging,
      practicalCards: [
        { id: 'spa', title: 'Spa', description: 'Voir la vidéo.', icon: 'bath', photoUrl: '/spa.jpg' },
        { id: 'plumber', title: 'Plombier', description: 'En cas de fuite.', icon: 'wrench', phone: '0450000000' },
      ],
    }
    render(<GuideHouseGuide lodging={lodging} onBack={jest.fn()} />)

    const blocks = screen.getAllByTestId('guide-equipment')
    expect(blocks[0].querySelector('img')).toHaveAttribute('src', '/spa.jpg')
    expect(within(blocks[0]).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(blocks[1]).getByRole('link', { name: /0450000000/ })).toHaveAttribute('href', 'tel:0450000000')
  })
})
