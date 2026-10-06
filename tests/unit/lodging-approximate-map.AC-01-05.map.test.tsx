/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

const mapInstances: Array<{ options: Record<string, unknown>; handlers: Record<string, () => void>; sources: Record<string, unknown>; layers: unknown[] }> = []
const markerCreated = jest.fn()

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    accessToken: '',
    Map: class {
      options: Record<string, unknown>
      handlers: Record<string, () => void> = {}
      sources: Record<string, unknown> = {}
      layers: unknown[] = []
      constructor(options: Record<string, unknown>) {
        this.options = options
        mapInstances.push(this)
      }
      on(event: string, handler: () => void) { this.handlers[event] = handler }
      addControl() {}
      addSource(id: string, source: unknown) { this.sources[id] = source }
      addLayer(layer: unknown) { this.layers.push(layer) }
      remove() {}
    },
    Marker: class {
      constructor() { markerCreated() }
      setLngLat() { return this }
      addTo() { return this }
    },
    NavigationControl: class {},
  },
}))

import { LodgingAreaMap } from '@/features/lodging-showcase/components/LodgingAreaMap'

const location = { latitude: 45.9001, longitude: 6.1302, radius_m: 300 }

describe('spec 088 — LodgingAreaMap', () => {
  const previousToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  beforeAll(() => { process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test' })
  afterAll(() => { process.env.NEXT_PUBLIC_MAPBOX_TOKEN = previousToken })
  beforeEach(() => { mapInstances.length = 0; markerCreated.mockClear() })

  it('AC-01: draws a ~50 m circle around the approximate centre, without marker nor directions', () => {
    render(<LodgingAreaMap location={location} areaLabel="Centre-ville" />)

    // Pas de bandeau de légende sous la carte (PO 2026-10-06) : le libellé reste accessible.
    expect(screen.getByRole('img', { name: 'Zone du logement : Centre-ville' })).toBeInTheDocument()
    expect(screen.queryByText('Emplacement approximatif')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /itinéraire/i })).not.toBeInTheDocument()
    expect(markerCreated).not.toHaveBeenCalled()

    const map = mapInstances[0]!
    expect(map.options.center).toEqual([6.1302, 45.9001])
    map.handlers.load!()
    const source = map.sources['lodging-area'] as { data: { geometry: { type: string; coordinates: number[][][] } } }
    expect(source.data.geometry.type).toBe('Polygon')
    expect(source.data.geometry.coordinates[0]!.length).toBeGreaterThan(32)
    expect(map.layers).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'fill' }), expect.objectContaining({ type: 'line' })]))
  })

  it('BR-01: keeps the page scrollable (scroll zoom disabled) in a compact frame', () => {
    const { container } = render(<LodgingAreaMap location={location} areaLabel="Annecy" />)
    expect(mapInstances[0]!.options.scrollZoom).toBe(false)
    expect(container.querySelector('.h-\\[260px\\]')).not.toBeNull()
  })
})
