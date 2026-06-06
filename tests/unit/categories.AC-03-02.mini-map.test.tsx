/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { MiniMap } from '@/features/categories/components/MiniMap'

describe('MiniMap — AC-03-02', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test-token'
  })

  it('renders an <img> element (not a canvas or iframe)', () => {
    render(<MiniMap latitude={45.8921} longitude={6.7085} poiName="Le Bistrot" />)
    const img = screen.getByRole('img')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('data-testid', 'mini-map')
  })

  it('img src contains Mapbox Static Images API URL with monochrome style, red pin and correct coordinates', () => {
    render(<MiniMap latitude={45.8921} longitude={6.7085} poiName="Le Bistrot" />)
    const img = screen.getByTestId('mini-map')
    const src = img.getAttribute('src') ?? ''
    expect(src).toContain('api.mapbox.com/styles/v1/mapbox/light-v11/static')
    expect(src).toContain('pin-s+ef4444(6.7085,45.8921)')
    expect(src).toContain('6.7085')
    expect(src).toContain('45.8921')
    expect(src).toContain('/6.7085,45.8921,16/')
    expect(src).toContain('pk.test-token')
  })

  it('has no interactive map controls (no canvas, no mapboxgl container)', () => {
    const { container } = render(<MiniMap latitude={45.8921} longitude={6.7085} poiName="Le Bistrot" />)
    expect(container.querySelector('canvas')).toBeNull()
    expect(container.querySelector('.mapboxgl-map')).toBeNull()
  })
})
