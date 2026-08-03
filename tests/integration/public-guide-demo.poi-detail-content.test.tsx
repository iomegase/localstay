/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

function openRondDeCarotte() {
  render(<GuideApp mode="demo" lodging={demoLodging} pois={demoPois} initialView="favorites" />)
  fireEvent.click(screen.getByRole('button', { name: /ouvrir rond de carotte/i }))
}

describe('Demo POI detail reproduces the private guide content', () => {
  it('shows the real rating, review count, hours, owner note, distance and photo credit', () => {
    openRondDeCarotte()

    // En-tête
    expect(screen.getByRole('heading', { name: 'Rond de Carotte' })).toBeInTheDocument()
    expect(screen.getByTestId('poi-detail-rating')).toHaveTextContent('4.8')
    expect(screen.getByTestId('poi-detail-rating-count')).toHaveTextContent('367 avis')

    // Distance depuis le logement
    expect(screen.getByTestId('poi-detail-distance')).toHaveTextContent(/du logement$/)

    // Mot de l'hôte (contenu réel récupéré en base)
    expect(screen.getByTestId('owner-recommendation-note-text')).toHaveTextContent(
      /Une belle adresse du coin/i,
    )

    // Horaires réels
    expect(screen.getByText('Dimanche')).toBeInTheDocument()
    expect(screen.getAllByText('Fermé').length).toBeGreaterThan(0)

    // Crédit photo
    expect(screen.getByTestId('photo-attribution')).toHaveTextContent('www.ronddecarotte.com')

    // Actions internes + externes
    expect(screen.getByRole('button', { name: 'Carte' })).toBeInTheDocument()
  })

  it('omits rating and credit for POIs without that data (fallback stays clean)', () => {
    render(<GuideApp mode="demo" lodging={demoLodging} pois={demoPois} initialView="favorites" />)
    fireEvent.click(screen.getByRole('button', { name: /ouvrir piscine de saint-gervais/i }))

    expect(screen.getByRole('heading', { name: 'Piscine de Saint-Gervais' })).toBeInTheDocument()
    expect(screen.queryByTestId('poi-detail-rating-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('photo-attribution')).not.toBeInTheDocument()
    // La distance reste toujours affichée
    expect(within(screen.getByTestId('poi-detail-distance')).queryByText(/du logement/)).not.toBeNull()
  })
})
