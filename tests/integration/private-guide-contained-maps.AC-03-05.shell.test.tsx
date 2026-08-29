/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { TrailStartModal } from '@/features/trail-navigation/components/TrailStartModal'
import TrailNavigationStartPage from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/start/page'
import type { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'

const mockTrailNavigationProps = jest.fn()
const mockRouterBack = jest.fn()
const mockGetPublishedTrail = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: () => ({ back: mockRouterBack }),
}))

jest.mock('@/features/trails-acquisition/queries/public-trails', () => ({
  getPublishedTrail: (...args: unknown[]) => mockGetPublishedTrail(...args),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais-les-bains',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice',
  })),
}))

jest.mock('@/features/trail-navigation/components/TrailNavigationMap', () => ({
  TrailNavigationMap: (
    props: ComponentProps<typeof TrailNavigationMap>,
  ) => {
    mockTrailNavigationProps(props)
    return <div data-testid="contained-trail-map" />
  },
}))

const trail = {
  id: 'trail-1',
  slug: 'porcherey',
  name: 'Alpage de Porcherey',
  description: 'Randonnée facile.',
  start_label: 'Départ',
  start_latitude: 45.8,
  start_longitude: 6.7,
  geometry_geojson: {
    type: 'LineString' as const,
    coordinates: [
      [6.7, 45.8],
      [6.71, 45.81],
    ],
  },
  difficulty: 'easy',
  distance_km: 8.3,
  elevation_gain_m: 709,
  estimated_duration_min: 210,
  data_quality_status: 'complete',
  source_refs: [],
}

describe('040-private-guide contained hiking maps', () => {
  beforeEach(() => {
    mockTrailNavigationProps.mockClear()
    mockRouterBack.mockClear()
    mockGetPublishedTrail.mockReset()
    mockGetPublishedTrail.mockResolvedValue(trail)
  })

  it('AC-04: contains the intercepted hiking map in the shared phone frame', () => {
    render(<TrailStartModal trail={trail} backHref="/guide/saint-gervais/rando" />)

    expect(screen.getByTestId('private-guide-shell')).toHaveClass(
      'overflow-hidden',
      'min-[480px]:h-[min(820px,calc(100dvh-24px))]',
      'min-[480px]:w-[min(430px,calc(100vw-24px))]',
      'min-[480px]:border-[5px]',
      'min-[480px]:border-white',
      'min-[480px]:rounded-[2.75rem]',
    )
    expect(mockTrailNavigationProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ contained: true }),
    )
  })

  it('AC-05: contains a directly opened hiking map in the same phone frame', async () => {
    render(
      await TrailNavigationStartPage({
        params: Promise.resolve({
          'city-slug': 'saint-gervais-les-bains',
          'category-slug': 'rando',
          'poi-slug': 'porcherey',
        }),
      }),
    )

    expect(screen.getByTestId('private-guide-shell')).toHaveClass(
      'overflow-hidden',
      'min-[480px]:h-[min(820px,calc(100dvh-24px))]',
      'min-[480px]:w-[min(430px,calc(100vw-24px))]',
      'min-[480px]:border-[5px]',
      'min-[480px]:border-white',
      'min-[480px]:rounded-[2.75rem]',
    )
    expect(mockTrailNavigationProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        contained: true,
        backHref: '/guide/saint-gervais-les-bains/rando',
      }),
    )
  })
})
