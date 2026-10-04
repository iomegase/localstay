/** @jest-environment node */
import { createHash } from 'node:crypto'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingAmenity: { findMany: jest.fn() },
    contentTranslation: { findMany: jest.fn() },
  },
}))

import { localizeLodgingCards, localizeLodgingDetail } from '@/features/content-translation/queries/lodging-showcase'
import { prisma } from '@/shared/lib/prisma'
import type { GuideLodgingCard, GuideLodgingDetail } from '@/features/guide-app/types'

const hash = (text: string) => createHash('sha256').update(text.trim()).digest('hex')
const row = (entity_type: string, entity_id: string, field_name: string, source: string, translated_text: string) =>
  ({ entity_type, entity_id, field_name, source_text_hash: hash(source), translated_text })

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.lodgingAmenity.findMany as jest.Mock).mockResolvedValue([
    { id: 'am-1', label: 'Cheminée' },
    { id: 'am-2', label: 'Lave-linge' },
  ])
  ;(prisma.contentTranslation.findMany as jest.Mock).mockResolvedValue([
    row('LodgingPublicProfile', 'profile-1', 'description', 'Un spacieux appartement de 170 m².', 'A spacious 170 m² flat.'),
    row('LodgingPublicProfile', 'profile-1', 'property_type', 'appartement', 'flat'),
    row('LodgingPublicProfile', 'profile-1', 'short_description', 'Au calme', 'Peaceful'),
    row('LodgingAmenity', 'am-1', 'label', 'Cheminée', 'Fireplace'),
    row('LodgingPhoto', 'photo-1', 'room_label', 'Chambre 7', 'Bedroom 7'),
  ])
})

const detail = (): GuideLodgingDetail & { photos: Array<GuideLodgingDetail['photos'][number] & { id?: string }> } => ({
  title: 'La Pieuca',
  cityName: 'Les Contamines-Montjoie',
  propertyType: 'appartement',
  description: 'Un spacieux appartement de 170 m².',
  maxGuests: 10,
  bedroomCount: 5,
  bathroomCount: 3,
  surfaceM2: 160,
  photos: [
    { id: 'photo-1', url: '/a.jpg', alt: '', roomType: 'bedroom', roomLabel: 'Chambre 7' },
    { id: 'photo-2', url: '/b.jpg', alt: '', roomType: 'kitchen', roomLabel: 'Cuisine' },
  ],
  amenitiesIncluded: ['Cheminée', 'Lave-linge'],
  amenitiesOnRequest: [],
})

describe('061 A3 AC-02-08 — logements dans le guide privé', () => {
  it('fiche : description, type, équipements et pièces traduits ; titre inchangé ; le reste en français', async () => {
    const result = await localizeLodgingDetail('profile-1', detail())
    expect(result.title).toBe('La Pieuca')
    expect(result.cityName).toBe('Les Contamines-Montjoie')
    expect(result.description).toBe('A spacious 170 m² flat.')
    expect(result.propertyType).toBe('flat')
    expect(result.amenitiesIncluded).toEqual(['Fireplace', 'Lave-linge'])
    expect(result.photos.map(photo => photo.roomLabel)).toEqual(['Bedroom 7', 'Cuisine'])
  })

  it('liste : type et accroche traduits, équipements internes laissés en français (icônes)', async () => {
    const cards = [{ id: 'profile-1', propertyType: 'appartement', shortDescription: 'Au calme', amenities: ['Piscine'] }] as unknown as GuideLodgingCard[]
    const [card] = await localizeLodgingCards(cards)
    expect(card.propertyType).toBe('flat')
    expect(card.shortDescription).toBe('Peaceful')
    expect(card.amenities).toEqual(['Piscine'])
  })
})
