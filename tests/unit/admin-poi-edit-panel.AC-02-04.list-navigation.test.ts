const mockCityFindFirst = jest.fn()
const mockPoiFindMany = jest.fn()
const mockPoiCount = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: (...args: unknown[]) => mockCityFindFirst(...args) },
    pointOfInterest: {
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
      count: (...args: unknown[]) => mockPoiCount(...args),
      groupBy: jest.fn(async () => []),
    },
    poiAcquisitionRun: { findMany: jest.fn(async () => []) },
  },
}))

import {
  adminPoiListHref,
  adminPoiPanelHref,
  buildAdminPoiListFilters,
  panelNeighbors,
} from '@/features/admin-pois/lib/list-filters'
import { listAdminPoiIds } from '@/features/admin-pois/queries/admin-pois'

// Spec 068 — filtres conservés, Précédent / Suivant, ordre stable.
const params = {
  city_id: 'city-sg',
  q: 'ski',
  category_id: 'cat-shop',
  status: 'current',
  discovery_status: 'ALL',
  page: '2',
  unknown: 'ignoré',
}

describe('068 AC-02-03 / BR-03 — filtres portés par l’URL', () => {
  it('reconstruit l’URL de la liste avec tous ses filtres (pas seulement la ville)', () => {
    expect(adminPoiListHref(params)).toBe(
      '/admin/pois?city_id=city-sg&q=ski&category_id=cat-shop&status=current&discovery_status=ALL&page=2',
    )
  })

  it('ouvre une fiche en gardant les filtres de la liste', () => {
    expect(adminPoiPanelHref('poi-1', params)).toBe(
      '/admin/pois/poi-1?city_id=city-sg&q=ski&category_id=cat-shop&status=current&discovery_status=ALL&page=2',
    )
  })

  it('sans filtre, revient à la liste nue', () => {
    expect(adminPoiListHref({})).toBe('/admin/pois')
  })

  it('analyse les filtres comme la page liste', () => {
    expect(buildAdminPoiListFilters('city-sg', params)).toEqual({
      city_id: 'city-sg',
      q: 'ski',
      category_id: 'cat-shop',
      subcategory_id: undefined,
      status: 'current',
      geocode_status: undefined,
      photo_status: undefined,
      review_source: undefined,
      discovery_status: undefined,
      page: 2,
      limit: 25,
    })
  })
})

describe('068 AC-04-01 / AC-04-02 — Précédent / Suivant', () => {
  const ids = ['a', 'b', 'c']

  it('indique la position et les fiches voisines', () => {
    expect(panelNeighbors(ids, 'b', params)).toEqual({
      index: 2,
      total: 3,
      previousHref: adminPoiPanelHref('a', params),
      nextHref: adminPoiPanelHref('c', params),
    })
  })

  it('s’arrête au dernier POI de la page (OQ-03)', () => {
    expect(panelNeighbors(ids, 'c', params)).toMatchObject({ index: 3, nextHref: null })
    expect(panelNeighbors(ids, 'a', params)).toMatchObject({ index: 1, previousHref: null })
  })

  it('renvoie null si la fiche n’est pas dans la page courante', () => {
    expect(panelNeighbors(ids, 'z', params)).toBeNull()
  })
})

describe('068 — ordre stable de la liste', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue({ id: 'city-sg' })
  })

  it('liste les identifiants de la page courante, triés par nom puis id', async () => {
    mockPoiFindMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }])

    const result = await listAdminPoiIds(buildAdminPoiListFilters('city-sg', params))

    expect(result).toEqual(['a', 'b'])
    expect(mockPoiFindMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: 25,
      take: 25,
      select: { id: true },
    }))
  })
})
