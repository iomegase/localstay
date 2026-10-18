/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { buildStayLodging } from '../support/guide-stay-lodging'

it.each([
  ['https://maps.app.goo.gl/abc', 'https://maps.app.goo.gl/abc'],
  ['Route des Thermes', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Route des Thermes Saint-Gervais-les-Bains')}`],
  [null, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('point de tri Saint-Gervais-les-Bains')}`],
])('AC-04-01: shows recycling content and uses the correct destination for %s', (trashLocation, href) => {
  render(<GuideHouseGuide lodging={buildStayLodging({
    trashLocation,
    practicalCards: [{ id: 'tri', icon: 'recycle', title: 'Recyclage', description: 'Déposez le verre au point de tri.' }],
  })} onBack={jest.fn()} />)
  expect(screen.getByText('Déposez le verre au point de tri.')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Infos pratiques' })).not.toBeInTheDocument()
  expect(screen.queryByText('Conciergerie')).not.toBeInTheDocument()
  const recycling = screen.getByRole('heading', { name: 'Point de tri' }).parentElement!
  // Toute la carte est le lien (PO 2026-10-18) : nom accessible = texte visible, sans œil.
  const card = within(recycling).getByRole('link', { name: 'Trouver le point de recyclage' })
  expect(card).toHaveAttribute('href', href)
  expect(card.querySelector('.lucide-recycle')).not.toBeNull()
  expect(card.querySelector('.lucide-eye')).toBeNull()
  expect(screen.queryByTestId('arrival-address')).not.toBeInTheDocument()
  expect(within(recycling).getAllByRole('link')).toHaveLength(1)
})

it('AC-04-01: demo recycling and address keep external Maps links hidden', () => {
  render(<GuideHouseGuide lodging={buildStayLodging()} onBack={jest.fn()} demo />)
  expect(screen.getByText('Trouver le point de recyclage')).toBeInTheDocument()
  expect(screen.queryByTestId('arrival-address')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Ouvrir dans Maps|Trouver le point de recyclage/ })).not.toBeInTheDocument()
})
