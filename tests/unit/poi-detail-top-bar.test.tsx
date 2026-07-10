/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailTopBar } from '@/features/categories/components/PoiDetailTopBar'

describe('PoiDetailTopBar', () => {
  it('does not capture clicks across the full header width', () => {
    render(
      <PoiDetailTopBar>
        <button type="button">Retour</button>
        <a href="/partager">Partager</a>
      </PoiDetailTopBar>,
    )

    const topBar = screen.getByTestId('poi-detail-top-bar')
    expect(topBar).toHaveClass('pointer-events-none')
    expect(topBar.firstElementChild).toHaveClass(
      '[&_a]:pointer-events-auto',
      '[&_button]:pointer-events-auto',
    )
  })
})
