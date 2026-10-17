/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { DescriptionSources } from '@/shared/components/DescriptionSources'
import { GuidePoiDetails } from '@/features/guide-app/components/GuidePoiDetails'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ location: null, status: 'idle', requestLocation: jest.fn(), clearLocation: jest.fn() }),
}))

const sources = [
  { url: 'https://www.lescontamines.com/cascade', title: 'Office de tourisme des Contamines' },
  { url: 'https://aubergedelagorge.com/', title: 'aubergedelagorge.com' },
]

// Spec 094 AC-06 — « Sources : » sous la description des fiches POI.
describe('094 AC-06 — sources sous la description', () => {
  it('une ligne « Sources : » avec un lien par source, nouvel onglet, nofollow', () => {
    render(<DescriptionSources sources={sources} />)
    expect(screen.getByTestId('poi-description-sources')).toHaveTextContent('Sources : Office de tourisme des Contamines · aubergedelagorge.com')
    const link = screen.getByRole('link', { name: 'Office de tourisme des Contamines' })
    expect(link).toHaveAttribute('href', 'https://www.lescontamines.com/cascade')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer')
  })

  it('sans source, rien n’est affiché', () => {
    const { container } = render(<DescriptionSources sources={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('la fiche du guide privé affiche les sources de la description', () => {
    render(
      <GuidePoiDetails
        mode="private"
        poi={buildStayPoi({ name: 'La Vieille Auberge', description: 'Auberge savoyarde.', descriptionSources: sources })}
        lodging={buildStayLodging()}
        onBack={jest.fn()}
        onShowOnMap={jest.fn()}
      />,
    )
    expect(screen.getByTestId('poi-description-sources')).toHaveTextContent('Sources : Office de tourisme des Contamines · aubergedelagorge.com')
  })
})
