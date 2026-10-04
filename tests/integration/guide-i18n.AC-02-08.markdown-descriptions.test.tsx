/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source?: string | null }) => <div data-testid="markdown">{source}</div>,
}))
jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ location: null, status: 'idle', requestLocation: jest.fn(), clearLocation: jest.fn() }),
}))

import { GuideLodgingDetailView } from '@/features/guide-app/components/GuideLodgingDetailView'
import { GuidePoiDetails } from '@/features/guide-app/components/GuidePoiDetails'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

it('PO 2026-10-04 : la description d’un logement est rendue en Markdown', () => {
  render(
    <GuideLodgingDetailView
      detail={{
        title: 'Les Hauts de Saint-Gervais', cityName: 'Saint-Gervais-les-Bains', propertyType: 'appartement',
        description: '## À propos\n\nÀ **5 minutes** du centre.', maxGuests: 4, bedroomCount: 2, bathroomCount: 1, surfaceM2: 65,
        photos: [], amenitiesIncluded: [], amenitiesOnRequest: [],
      }}
      onBack={jest.fn()}
    />,
  )
  expect(screen.getByTestId('markdown')).toHaveTextContent('## À propos À **5 minutes** du centre.')
})

it('PO 2026-10-04 : la description d’un lieu est rendue en Markdown', () => {
  render(
    <GuidePoiDetails mode="private" poi={buildStayPoi({ description: 'Ferme de **1850**.' })} lodging={buildStayLodging()} onBack={jest.fn()} onShowOnMap={jest.fn()} />,
  )
  expect(screen.getByTestId('markdown')).toHaveTextContent('Ferme de **1850**.')
})
