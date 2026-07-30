/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideMapView } from '@/features/guide-app/components/GuideMapView'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

jest.mock('react-map-gl/mapbox', () => {
  const MockMap = React.forwardRef<
    { flyTo: jest.Mock },
    { children: React.ReactNode }
  >(({ children }, ref) => {
    React.useImperativeHandle(ref, () => ({ flyTo: jest.fn() }))
    return <div data-testid="mapbox-map">{children}</div>
  })
  MockMap.displayName = 'MockMap'

  return {
    __esModule: true,
    default: MockMap,
    Marker: ({
      children,
    }: {
      children: React.ReactNode
    }) => <div data-testid="mapbox-marker">{children}</div>,
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
})
