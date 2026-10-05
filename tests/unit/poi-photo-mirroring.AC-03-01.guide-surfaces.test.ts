/** @jest-environment node */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    category: { findFirst: jest.fn(), findMany: jest.fn() },
    subCategory: { findFirst: jest.fn() },
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn(), findFirst: jest.fn() },
    lodgingPublicProfile: { findFirst: jest.fn() },
  },
}))

const LOGO = 'https://www.site.example/images/logo.png'
const ORIGINAL = 'https://www.site.example/photos/salle.jpg'
const COPY = 'https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/pois/poi-1/abc.webp'
const LOGO_COPY = 'https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/pois/poi-1/logo.webp'
jest.mock('@/features/poi-photos/queries/photo-mirror-map', () => ({
  getPoiPhotoMirrorMap: jest.fn(async () => new Map([[ORIGINAL, COPY], [LOGO, LOGO_COPY]])),
  resolvePoiPhotoUrl: (url: string, map: ReadonlyMap<string, string>) => map.get(url) ?? url,
  resolvePoiPhotoList: (urls: string[], map: ReadonlyMap<string, string>) => urls.map(url => map.get(url) ?? url),
}))

import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { getAllPoiCards } from '@/features/categories/queries/all-poi-cards'
import { searchGuide } from '@/features/city-guide/queries/cities'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { getPublishedLodgingDetailBySlug } from '@/features/lodging-showcase/queries/public-lodgings'
import { prisma } from '@/shared/lib/prisma'

function poiRow() {
  return {
    id: 'poi-1', name: 'Brasserie', slug: 'brasserie', address: 'Saint-Gervais',
    latitude: 45.89, longitude: 6.71, rating: null, rating_count: 0, is_open_now: null, hours: null,
    // Le logo vient en premier : il doit être écarté sur son URL d'origine, avant résolution.
    photos: [LOGO, ORIGINAL],
    phone: null, website: null, description: null, geocode_status: 'success',
    subcategory: null, trail_detail: null,
    category: { slug: 'diner', name: 'Restaurants', icon: 'utensils' },
    city: { slug: 'saint-gervais-les-bains' },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(prisma.city.findFirst).mockResolvedValue({ id: 'city-1', latitude: 45.89, longitude: 6.71 } as never)
  jest.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as never)
  jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
  jest.mocked(prisma.lodging.findFirst).mockResolvedValue(null)
  jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([poiRow()] as never)
})

describe('063 AC-03-01 — le guide sert les copies', () => {
  it('cartes de catégorie : photo principale et galerie résolues, logo toujours écarté', async () => {
    const result = await getPoiCards('saint-gervais-les-bains', 'diner')
    const card = result!.primary[0]
    expect(card.photo_url).toBe(COPY)
    expect(card.photos).toEqual([LOGO_COPY, COPY])
  })

  it('liste complète : photo principale résolue', async () => {
    const result = await getAllPoiCards('saint-gervais-les-bains')
    expect(result!.items[0].photo_url).toBe(COPY)
  })

  it('recherche du guide : vignette résolue', async () => {
    const result = await searchGuide('saint-gervais-les-bains', 'bra')
    expect(result.pois[0].photo).toBe(LOGO_COPY)
  })

  it('guide privé : photos des recommandations résolues', async () => {
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', name: 'Chalet', city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: null, practical_blocks: [], arrival_instructions: [],
    } as never)
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([{ owner_note: null, poi: poiRow() }] as never)
    const data = await getPrivateGuideData('lodging-1')
    expect(data!.pois[0].photos).toContain(COPY)
    expect(data!.pois[0].photos.some(photo => photo === ORIGINAL)).toBe(false)
  })

  // Revue finale (point 4) : surfaces oubliées.
  it('fiche POI du guide : galerie servie depuis les copies', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue({
      id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains',
      region: 'Auvergne-Rhône-Alpes', postal_code: '74170', latitude: 45.89, longitude: 6.71,
    } as never)
    jest.mocked(prisma.pointOfInterest.findFirst).mockResolvedValue({
      ...poiRow(), category: { id: 'cat-1', name: 'Restaurants', slug: 'diner', icon: 'utensils' },
      subcategory: null, hiking_detail: null, trail_detail: null, merchant_offers: [],
    } as never)
    const detail = await getPoiDetail('saint-gervais-les-bains', 'diner', 'brasserie')
    expect(detail!.photos).toEqual([LOGO_COPY, COPY])
  })

  it('page logement : photo des lieux mis en avant servie depuis la copie, logo écarté', async () => {
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue({
      id: 'profile-1', slug: 'chalet', title: 'Chalet', short_description: 'Court', description: 'Long',
      property_type: 'chalet', max_guests: 4, bedroom_count: 2, bathroom_count: 1, bed_count: 2, surface_m2: 80,
      public_area_label: null, photos: [], amenities: [], faq_items: [],
      external_booking_url: null, external_booking_platform: null, public_contact_enabled: true,
      precise_location_public: false, public_latitude: null, public_longitude: null,
      city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', region: null },
      lodging: { featured_pois: [{ owner_note: null, poi: {
        id: 'poi-1', name: 'Brasserie', slug: 'brasserie', photos: [LOGO, ORIGINAL],
        category: { slug: 'diner' }, city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
      } }] },
    } as never)
    const detail = await getPublishedLodgingDetailBySlug('chalet')
    expect(detail!.owner_recommendations[0].photo_url).toBe(COPY)
  })
})
