/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TrailPreviewMap } from '@/features/trail-navigation/components/TrailPreviewMap'

const base = {
  name: 'Col de Voza',
  geometry: { type: 'LineString', coordinates: [[6.7, 45.8], [6.71, 45.81]] },
  startLatitude: 45.8,
  startLongitude: 6.7,
  startHref: '/guide/x/rando/col-de-voza/start',
}

describe('TrailPreviewMap — badge fiabilité du tracé', () => {
  it('affiche "Tracé indicatif" quand reliability=indicative', () => {
    render(<TrailPreviewMap {...base} reliability="indicative" />)
    expect(screen.getByText(/tracé indicatif/i)).toBeInTheDocument()
  })

  it('n’affiche pas le badge quand reliability=reliable', () => {
    render(<TrailPreviewMap {...base} reliability="reliable" />)
    expect(screen.queryByText(/tracé indicatif/i)).not.toBeInTheDocument()
  })

  it('n’affiche pas le badge par défaut (reliability omis)', () => {
    render(<TrailPreviewMap {...base} />)
    expect(screen.queryByText(/tracé indicatif/i)).not.toBeInTheDocument()
  })
})
