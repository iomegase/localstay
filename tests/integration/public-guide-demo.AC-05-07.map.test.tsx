/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideMapView } from '@/features/guide-app/components/GuideMapView'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

jest.mock('react-map-gl/mapbox', () => {
  const MockMap = React.forwardRef<
    { flyTo: jest.Mock },
    { children: React.ReactNode; onClick?: () => void }
  >(({ children, onClick }, ref) => {
    React.useImperativeHandle(ref, () => ({ flyTo: jest.fn() }))
    return <div data-testid="mapbox-map" onClick={onClick}>{children}</div>
  })
  MockMap.displayName = 'MockMap'

  return {
    __esModule: true,
    default: MockMap,
    Marker: ({
      children,
      onClick,
    }: {
      children: React.ReactNode
      onClick?: (event: { originalEvent: { stopPropagation: () => void } }) => void
    }) => (
      <div
        data-testid="mapbox-marker"
        onClick={event => {
          event.stopPropagation()
          onClick?.({ originalEvent: { stopPropagation: jest.fn() } })
        }}
      >
        {children}
      </div>
    ),
    NavigationControl: () => <div data-testid="mapbox-navigation" />,
    Source: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mapbox-source">{children}</div>
    ),
    Layer: () => <div data-testid="mapbox-layer" />,
  }
})

describe('GuideMapView demo', () => {
  it('renders the lodging and every POI from the single demo collection', () => {
    render(
      <GuideMapView
        lodging={demoLodging}
        pois={demoPois}
        selectedPoiId={null}
        selectedCategorySlug={null}
        onFilter={jest.fn()}
        onSelectPoi={jest.fn()}
        onDeselectPoi={jest.fn()}
        onOpenPoi={jest.fn()}
      />,
    )

    expect(
      screen.getByLabelText(`Position du logement ${demoLodging.name}`),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /sélectionner /i }),
    ).toHaveLength(demoPois.length)
  })

  it('selects a POI marker and opens its preview sheet', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')
    expect(porcherey).toBeDefined()
    const onSelectPoi = jest.fn()
    const onOpenPoi = jest.fn()

    const { rerender } = render(
      <GuideMapView
        lodging={demoLodging}
        pois={demoPois}
        selectedPoiId={null}
        selectedCategorySlug={null}
        onFilter={jest.fn()}
        onSelectPoi={onSelectPoi}
        onDeselectPoi={jest.fn()}
        onOpenPoi={onOpenPoi}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: `Sélectionner ${porcherey?.name}`,
      }),
    )
    expect(onSelectPoi).toHaveBeenCalledWith(porcherey)

    rerender(
      <GuideMapView
        lodging={demoLodging}
        pois={demoPois}
        selectedPoiId={porcherey?.id ?? null}
        selectedCategorySlug={null}
        onFilter={jest.fn()}
        onSelectPoi={onSelectPoi}
        onDeselectPoi={jest.fn()}
        onOpenPoi={onOpenPoi}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: `Ouvrir la fiche ${porcherey?.name}`,
      }),
    )
    expect(onOpenPoi).toHaveBeenCalledWith(porcherey)
  })

  it('005 AC-02-03: closes the selected POI preview when the map background is clicked', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')
    expect(porcherey).toBeDefined()
    const onDeselectPoi = jest.fn()

    render(
      <GuideMapView
        lodging={demoLodging}
        pois={demoPois}
        selectedPoiId={porcherey?.id ?? null}
        selectedCategorySlug={null}
        onFilter={jest.fn()}
        onSelectPoi={jest.fn()}
        onDeselectPoi={onDeselectPoi}
        onOpenPoi={jest.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: `Ouvrir la fiche ${porcherey?.name}` }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('mapbox-map'))

    expect(onDeselectPoi).toHaveBeenCalledTimes(1)
  })
})
