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

  it('renders a compact non-interactive preview when startHref is absent', () => {
    render(
      <TrailPreviewMap
        {...base}
        startHref={null}
        variant="compact"
      />,
    )

    const preview = screen.getByLabelText('Aperçu de la randonnée Col de Voza')
    expect(preview).not.toHaveAttribute('href')
    expect(preview.closest('a')).toBeNull()
    expect(screen.getByTestId('trail-preview-viewport')).toHaveClass('h-[190px]')
  })

  it('keeps the private preview interactive by default', () => {
    render(<TrailPreviewMap {...base} />)

    expect(
      screen.getByRole('link', { name: 'Démarrer la randonnée Col de Voza' }),
    ).toHaveAttribute('href', base.startHref)
    expect(screen.getByTestId('trail-preview-viewport')).toHaveClass('h-[340px]')
  })
})
