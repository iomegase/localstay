/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DemoMapView } from '@/features/guide-demo/components/DemoMapView'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

jest.mock('react-map-gl/mapbox', () => {
  const MockMap = React.forwardRef<
    { getMap: () => Record<string, jest.Mock> },
    { children: React.ReactNode; onClick?: () => void }
  >(({ children, onClick }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getMap: () => ({
        addLayer: jest.fn(),
        easeTo: jest.fn(),
        fitBounds: jest.fn(),
        getLayer: jest.fn(() => true),
        getPitch: jest.fn(() => 0),
        getStyle: jest.fn(() => ({ layers: [] })),
        getZoom: jest.fn(() => 12),
      }),
    }))
    return (
      <div data-testid="mapbox-map" onClick={onClick}>
        {children}
      </div>
    )
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
    Source: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mapbox-source">{children}</div>
    ),
    Layer: () => <div data-testid="mapbox-layer" />,
  }
})

describe('public demo map private-guide parity', () => {
  it('renders the same Mapbox surface, lodging pin, filters and controls as the private guide', () => {
    const onFilter = jest.fn()

    render(
      <DemoMapView
        lodging={demoLodging}
        pois={demoPois}
        selectedPoi={null}
        selectedCategorySlug={null}
        onFilter={onFilter}
        onSelectPoi={jest.fn()}
        onDeselectPoi={jest.fn()}
        onOpenPoi={jest.fn()}
      />,
    )

    expect(screen.getByTestId('guide-map')).toBeInTheDocument()
    expect(screen.getByTestId('mapbox-map')).toBeInTheDocument()
    expect(
      screen.getByLabelText(`Position du logement ${demoLodging.name}`),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoomer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dézoomer' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restaurants' }))
    expect(onFilter).toHaveBeenCalledWith('diner')
  })
})
